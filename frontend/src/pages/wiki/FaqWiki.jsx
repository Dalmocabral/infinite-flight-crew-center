import React from 'react';
import { Typography, Box, Breadcrumbs, Link, Divider, Grid } from '@mui/material';

const FaqWiki = () => {
    const faqs = [
        {
            id: 'email-recovery',
            question: '1. I didn\'t receive my password recovery email.',
            answer: [
                'First, check your Spam or Junk folder. Depending on your email provider, such as Gmail or Outlook, the message may also appear in the Promotions or Offers tab.',
                'If you still haven\'t received the email after a few minutes, please contact our team through our Discord server. We\'ll be happy to assist you in recovering your access.'
            ]
        },
        {
            id: 'delete-flight',
            question: '2. I made a terrible landing. Can I delete my flight?',
            answer: [
                'Yes.',
                'As long as your flight is still marked as Pending Review, you can edit or delete it directly from the My Flights page.',
                'Once the flight has been approved or rejected, it will be locked and can no longer be edited or removed.'
            ]
        },
        {
            id: 'report-bug',
            question: '3. I found a bug. How can I report it?',
            answer: [
                'If you encounter any bugs or unexpected behavior, please contact our team through our Discord server.',
                'When reporting an issue, try to include screenshots, your flight information, and a brief description of what happened. This helps us investigate and resolve problems much faster.'
            ]
        },
        {
            id: 'supported-simulators',
            question: '4. Which flight simulators are supported?',
            answer: [
                'At the moment, Infinite World Tour is designed exclusively for Infinite Flight.',
                'Support for additional simulators may be considered in the future, but currently only Infinite Flight is supported.'
            ]
        },
        {
            id: 'is-it-free',
            question: '5. Is Infinite World Tour free?',
            answer: [
                'Absolutely!',
                'Infinite World Tour is completely free for all registered pilots.',
                'Our goal is to provide a complete virtual airline experience where you can track your progress, participate in exclusive events, explore new destinations, and compete on the global leaderboards—completely free of charge.'
            ]
        },
        {
            id: 'inactive-account',
            question: '6. Why has my account been marked as inactive?',
            answer: [
                'To keep our community organized and our pilot roster up to date, accounts that remain inactive for 30 days or more are automatically marked as Inactive.',
                'If this happens, simply log in and request a reactivation email. Once confirmed, your account will be restored and you\'ll be ready to fly again.'
            ]
        },
        {
            id: 'fly-offline',
            question: '7. Can I fly offline?',
            answer: [
                'No.',
                'Infinite World Tour relies on data provided by the Infinite Flight servers to validate your flights.',
                'Flights performed in Solo (offline) mode are not recorded online and therefore cannot be validated.',
                'To ensure your flights are recognized, always fly on a Live Server (Casual, Training, or Expert).'
            ]
        },
        {
            id: 'cancel-booking',
            question: '8. Can I cancel a booked flight?',
            answer: [
                'Yes!',
                'You can cancel a booking at any time from your Dashboard or the My Flights page.',
                'If a booking is not used within 24 hours, it will automatically expire and be removed from the system.'
            ]
        },
        {
            id: 'simulator-closes',
            question: '9. What happens if the simulator closes during my flight?',
            answer: [
                'If the simulator closes unexpectedly or your flight is interrupted before reaching the destination airport, the flight cannot be completed.',
                'Since the operation wasn\'t successfully finished, Infinite World Tour won\'t be able to validate the flight.',
                'In this situation, simply cancel the current booking and create a new one when you\'re ready to fly again.'
            ]
        },
        {
            id: 'change-aircraft',
            question: '10. Can I change my aircraft after booking a flight?',
            answer: [
                'No.',
                'The aircraft you fly in Infinite Flight must be the same one selected when you booked the flight.',
                'If you use a different aircraft, the flight cannot be validated.',
                'If you change your mind before takeoff, simply cancel the booking and create a new one using your preferred aircraft.'
            ]
        },
        {
            id: 'join-world-tour',
            question: '11. How do I join a World Tour?',
            answer: [
                'Getting started is easy.',
                'Open the World Tours page from the navigation menu to browse all available tours.',
                'Choose the one you\'d like to join and click Join.',
                'Once you\'ve joined, each leg will be unlocked in the correct order as you progress through the tour.'
            ]
        },
        {
            id: 'flight-rejected',
            question: '12. My flight was rejected. How do I find out why?',
            answer: [
                'Whenever a flight is rejected, the reason will be displayed on the My Flights page.',
                'You can also open the Flight Briefing to review the complete analysis of your flight.',
                'If you still have questions, our support team will be happy to assist you through Discord.'
            ]
        },
        {
            id: 'free-flights',
            question: '13. Can I create Free Flights without joining a World Tour?',
            answer: [
                'Yes!',
                'You can create as many Free Flights as you\'d like through the Book Flight page.',
                'Simply choose your departure and arrival airports, select your aircraft, and decide whether the flight will be a passenger or cargo operation. Free Flights let you explore the world without being part of a World Tour.'
            ]
        },
        {
            id: 'contact-team',
            question: '14. How can I contact the team?',
            answer: [
                'If you need assistance, have questions, or experience any issues with the platform, you can contact our team through our official Discord server.',
                'We\'re always happy to help.'
            ]
        },
        {
            id: 'all-rules',
            question: '15. Where can I find all the rules?',
            answer: [
                'All guides, rules, and explanations about how Infinite World Tour works are available in this Wiki.',
                'Here you\'ll find information about:\n\n• Flight Bookings\n• World Tours\n• Pilot Progression\n• Flight Validation\n• Landing Rating System\n• Frequently Asked Questions',
                'We recommend reading the Wiki before your first flight to get the best experience.'
            ]
        },
        {
            id: 'any-airline',
            question: '16. Can I fly for any airline?',
            answer: [
                'Absolutely!',
                'Infinite World Tour is not tied to any specific virtual airline.',
                'You\'re free to choose any airline, callsign, or livery available in Infinite Flight.',
                'Fly the way you enjoy most and create your own journey across the virtual skies.'
            ]
        },
        {
            id: 'specific-livery',
            question: '17. Do I have to use a specific livery?',
            answer: [
                'No.',
                'You may use any livery available for your aircraft.',
                'Your flight is evaluated based on the operation itself—not on the livery you choose.'
            ]
        },
        {
            id: 'repeat-route',
            question: '18. Can I fly the same route more than once?',
            answer: [
                'Yes!',
                'For Free Flights, you may fly the same route as many times as you like.',
                'For World Tours, each leg only needs to be completed once to unlock the next one. After finishing the tour, you\'re free to fly those routes again using Free Flights.'
            ]
        },
        {
            id: 'progression-system',
            question: '19. How does the pilot progression system work?',
            answer: [
                'At the moment, Infinite World Tour does not restrict aircraft or routes based on pilot rank.',
                'We believe flight simulation should be enjoyable and accessible from day one. That\'s why you\'re free to fly any available aircraft and build your own journey without unnecessary limitations.',
                'As Infinite World Tour continues to grow, additional progression features may be introduced to make your career even more engaging.'
            ]
        },
        {
            id: 'landing-score',
            question: '20. How is my landing score calculated?',
            answer: [
                'Every flight starts with a perfect landing score.',
                'During landing, the system evaluates several aspects of your touchdown, including smoothness, stability, and runway alignment.',
                'The better your landing, the higher your final score.',
                'For a complete explanation of the scoring system, please visit the Landing Rating System section of the Wiki.'
            ]
        },
        {
            id: 'fly-with-friends',
            question: '21. Can I fly with friends?',
            answer: [
                'Of course!',
                'Flying with friends is one of the best ways to enjoy Infinite Flight.',
                'Each pilot simply needs to create their own flight booking before departure so that every flight can be tracked and validated individually.'
            ]
        },
        {
            id: 'daily-limit',
            question: '22. Is there a daily flight limit?',
            answer: [
                'No.',
                'You can complete as many flights as you like each day.',
                'Just make sure to complete or cancel your current booking before creating a new one.'
            ]
        },
        {
            id: 'fail-leg',
            question: '23. What happens if I fail a World Tour leg?',
            answer: [
                'Don\'t worry.',
                'If a flight isn\'t completed successfully or doesn\'t meet the required validation criteria, you can simply fly that leg again.',
                'The next leg will become available once the current one has been successfully completed.',
                'Take your time and enjoy the journey—there\'s no penalty for trying again.'
            ]
        }
    ];

    return (
        <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.85rem' }}>
                <Link underline="hover" color="inherit" href="#">Home</Link>
                <Link underline="hover" color="inherit" href="#">Basics</Link>
                <Typography color="text.primary" sx={{ fontSize: '0.85rem' }}>Frequently Asked Questions (FAQ)</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" sx={{ color: '#255a9e', mb: 1 }}>
                Frequently Asked Questions
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                Quick answers to the most common questions about using our Crew Center.
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={4}>
                {/* Menu de Âncoras (Esquerda) */}
                <Grid item xs={12} md={4} lg={3}>
                    <Box sx={{ position: 'sticky', top: '90px' }}>
                        <Typography variant="overline" fontWeight="bold" sx={{ color: '#888', letterSpacing: 1 }}>
                            PAGE CONTENTS
                        </Typography>
                        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2 }}>
                            {faqs.map((faq) => (
                                <Box component="li" key={`nav-${faq.id}`} sx={{ mb: 1.5 }}>
                                    <Link 
                                        href={`#${faq.id}`}
                                        underline="none" 
                                        sx={{ 
                                            color: '#255a9e', 
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            '&:hover': { color: '#1976d2', textDecoration: 'underline' }
                                        }}
                                    >
                                        › {faq.question}
                                    </Link>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Grid>

                {/* Conteúdo das Perguntas (Direita) */}
                <Grid item xs={12} md={8} lg={9}>
                    {faqs.map((faq) => (
                        <Box key={`content-${faq.id}`} id={faq.id} sx={{ mb: 5, scrollMarginTop: '100px' }}>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2', mb: 1.5 }}>
                                {faq.question}
                            </Typography>
                            {faq.answer.map((paragraph, idx) => (
                                <Typography key={idx} variant="body1" sx={{ color: '#333', lineHeight: 1.7, mb: 1.5, whiteSpace: 'pre-line' }}>
                                    {paragraph}
                                </Typography>
                            ))}
                        </Box>
                    ))}
                </Grid>
            </Grid>
        </Box>
    );
};

export default FaqWiki;
