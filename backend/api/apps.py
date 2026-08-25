from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals  # Substitua "seu_app" pelo nome do seu aplicativo
        
        # Monkey patch for django-jazzmin pagination bug in Django 5.0+
        try:
            from jazzmin.templatetags import jazzmin
            from django.utils.safestring import mark_safe
            from django.contrib.admin.views.main import PAGE_VAR
            
            def patched_paginator_number(change_list, i):
                html_str = ""
                start = i == 1
                end = i == change_list.paginator.num_pages
                spacer = i in (".", "…")
                current_page = i == change_list.page_num

                if start:
                    link = change_list.get_query_string({PAGE_VAR: change_list.page_num - 1}) if change_list.page_num > 1 else "#"
                    html_str += """
                    <li class="page-item previous {disabled}">
                        <a class="page-link" href="{link}" data-dt-idx="0" tabindex="0">«</a>
                    </li>
                    """.format(link=link, disabled="disabled" if link == "#" else "")

                if current_page:
                    html_str += """
                    <li class="page-item active">
                        <a class="page-link" href="javascript:void(0);" data-dt-idx="3" tabindex="0">{num}</a>
                    </li>
                    """.format(num=i)
                elif spacer:
                    html_str += """
                    <li class="page-item">
                        <a class="page-link" href="javascript:void(0);" data-dt-idx="3" tabindex="0">… </a>
                    </li>
                    """
                else:
                    query_string = change_list.get_query_string({PAGE_VAR: i})
                    end_str = "end" if end else ""
                    html_str += """
                        <li class="page-item">
                        <a href="{query_string}" class="page-link {end}" data-dt-idx="3" tabindex="0">{num}</a>
                        </li>
                    """.format(num=i, query_string=query_string, end=end_str)

                if end:
                    link = change_list.get_query_string({PAGE_VAR: change_list.page_num + 1}) if change_list.page_num < i else "#"
                    html_str += """
                    <li class="page-item next {disabled}">
                        <a class="page-link" href="{link}" data-dt-idx="7" tabindex="0">»</a>
                    </li>
                    """.format(link=link, disabled="disabled" if link == "#" else "")

                return mark_safe(html_str)
                
            jazzmin.register.simple_tag(name='jazzmin_paginator_number')(patched_paginator_number)
        except Exception:
            pass
