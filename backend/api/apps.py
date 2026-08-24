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
            
            original_jazzmin_paginator = jazzmin.jazzmin_paginator_number
            
            def patched_paginator_number(cl, i):
                if i == ".":
                    return mark_safe('<li class="page-item"><a class="page-link" href="#">...</a></li>')
                return original_jazzmin_paginator(cl, i)
                
            jazzmin.jazzmin_paginator_number = patched_paginator_number
        except Exception:
            pass
