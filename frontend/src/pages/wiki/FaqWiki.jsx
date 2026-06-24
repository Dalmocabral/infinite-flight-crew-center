import React, { useState, useEffect } from 'react';
import { Typography, Box, Breadcrumbs, Link, Divider, Grid } from '@mui/material';

const FaqWiki = () => {
    // Array de perguntas para facilitar a geração do menu e do conteúdo
    const faqs = [
        {
            id: 'email-registro',
            question: 'The registration email never arrived.',
            answer: 'First, please check your "Spam" or "Junk" folder. In some providers like Gmail or Outlook, the email might land in the "Promotions" or "Offers" tab. If you still cannot find the message after a few minutes, please contact our staff on our Discord server so we can activate your account manually.'
        },
        {
            id: 'excluir-voo',
            question: 'I had a very bad landing, can I delete the flight?',
            answer: 'Yes! If your flight is still marked as "In Review", you can delete or edit it directly from your PIREPs dashboard. Once the flight has been approved or rejected by the staff, it can no longer be deleted.'
        },
        {
            id: 'reportar-bug',
            question: 'I found a bug in the system. How do I report it?',
            answer: 'The best way to let us know about issues is through our support form (link will be available soon on Discord). This form helps us capture all necessary information, such as screenshots and flight logs, so we can fix the issue as quickly as possible.'
        },
        {
            id: 'simuladores',
            question: 'Which simulators does System Infinite World Tour support?',
            answer: 'Currently, our system and our Co-Pilot app are developed exclusively for Infinite Flight.'
        },
        {
            id: 'compatibilidade',
            question: 'Does the Co-Pilot app have a version for iOS, Mac, or PC?',
            answer: 'Not yet. For now, the app that monitors and sends your flight telemetry is only available for Android devices. Expanding to other platforms like iOS is definitely in our future plans!'
        },
        {
            id: 'world-tour-cost',
            question: 'Is the World Tour free?',
            answer: 'Yes, absolutely! The System Infinite World Tour is 100% free for all registered pilots. Our goal is to provide the best tracking and ranking experience for Infinite Flight without any costs. Join, fly, and compete on the global leaderboards!'
        },
        {
            id: 'inactive-account',
            question: 'Why was my account marked as inactive?',
            answer: 'As a company rule, if a pilot does not log in to the System Infinite World Tour for more than 30 days, their account is placed on reserve (inactive status) to keep the active pilot roster clean. If you see the inactive profile screen when logging in, simply click the button to request a reactivation email and follow the link to get back to active duty!'
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
                Quick answers to the most common questions about using our Crew Center and the app.
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
                            <Typography variant="body1" sx={{ color: '#333', lineHeight: 1.7 }}>
                                {faq.answer}
                            </Typography>
                        </Box>
                    ))}
                </Grid>
            </Grid>
        </Box>
    );
};

export default FaqWiki;
