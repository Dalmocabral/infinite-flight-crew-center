import { useState, useEffect } from 'react';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const url = 'https://corsproxy.io/?' + encodeURIComponent('https://community.infiniteflight.com/c/multiplayer/events/16.json');
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
        
        setEvents(upcomingEvents);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, isLoading };
};
