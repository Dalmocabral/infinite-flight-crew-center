import { useState, useEffect } from 'react';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const cacheKey = 'if_events_cache';
        const cacheTimeKey = 'if_events_cache_time';
        const cacheDuration = 30 * 60 * 1000; // 30 minutes

        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
            const nowTime = new Date().getTime();
            if (nowTime - parseInt(cachedTime) < cacheDuration) {
                setEvents(JSON.parse(cachedData));
                setIsLoading(false);
                return; // Use cache and skip fetching
            }
        }

        const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://community.infiniteflight.com/c/multiplayer/events/16.json');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const topics = data.topic_list?.topics || [];
        const parsedEvents = [];
        
        for (const topic of topics) {
          if (topic.event_starts_at) {
            parsedEvents.push({
              id: topic.id,
              title: topic.title,
              startsAt: topic.event_starts_at,
              endsAt: topic.event_ends_at,
              url: `https://community.infiniteflight.com/t/${topic.slug}/${topic.id}`,
              tags: (topic.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : (t.name || '').toString().toLowerCase()),
            });
          }
        }
        
        const now = new Date();
        const upcomingEvents = parsedEvents.filter(event => {
            const endDate = event.endsAt ? new Date(event.endsAt) : new Date(event.startsAt);
            if (!event.endsAt) endDate.setHours(endDate.getHours() + 24);
            return endDate > now;
        });
        
        upcomingEvents.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
        
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify(upcomingEvents));
        localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

        setEvents(upcomingEvents);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        
        // Se der erro na internet mas tivermos um cache velho, mostramos o cache velho para não ficar vazio
        const oldCache = localStorage.getItem('if_events_cache');
        if (oldCache) {
            setEvents(JSON.parse(oldCache));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, isLoading };
};
