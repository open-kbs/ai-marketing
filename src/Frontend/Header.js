import React, { useEffect, useState } from 'react';
import { isContentHTML } from "./utils";
import { IconButton } from '@mui/material';
import { Tune as TuneIcon } from '@mui/icons-material';
import AgentPanel from './AgentPanel';

const getChatId = () => window?.location?.pathname?.split('/chat/')?.[1];

const checkBusinessProfileExists = async (openkbs) => {
    try {
        const response = await openkbs.getItem('memory_business_profile');
        return !!response?.item;
    } catch (e) {
        return false;
    }
};

const getQueryParamValue = (paramName) => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(paramName);
};

const Header = ({ setRenderSettings, messages, setMessages, openkbs, setSystemAlert, setBlockingLoading }) => {
    const [profileChecked, setProfileChecked] = useState(false);
    const panelParam = getQueryParamValue('panel');
    const [panelExpanded, setPanelExpandedState] = useState(() => {
        return panelParam === 'files' || panelParam === 'access' || panelParam === 'memory';
    });
    const [initialTab] = useState(() => {
        if (panelParam === 'memory') return 1;
        if (panelParam === 'access') return 2;
        return 0;
    });

    // Update URL when panel state changes
    const setPanelExpanded = (value, tab = 'files') => {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set('panel', tab);
        } else {
            url.searchParams.delete('panel');
        }
        window.history.replaceState({}, '', url.toString());
        setPanelExpandedState(value);
    };

    useEffect(() => {
        setRenderSettings({
            setMessageWidth: (content) => isContentHTML(content) ? '90%' : undefined,
            enableGenerationModelsSelect: false,
            disableTextToSpeechButton: true,
            disableBalanceView: false,
            disableEmojiButton: true,
            disableShareButton: true,
            customStreamingLoader: true,
            disableMultichat: true,
            disableMobileLeftButton: true,
            disableSentLabel: false,
            disableChatModelsSelect: true,
            disableInitialScroll: true,
            backgroundOpacity: 0.02
        });
    }, [setRenderSettings]);

    useEffect(() => {
        const initializeChat = async () => {
            // Only check on new chats (no chatId and no messages)
            if (!getChatId() && (!messages || messages.length === 0) && !profileChecked) {
                const profileExists = await checkBusinessProfileExists(openkbs);
                setProfileChecked(true);

                // If no profile exists, show welcome message
                if (!profileExists) {
                    const welcomeMessage = {
                        msgId: `${+new Date()-10000}-${Math.floor(100000 + Math.random() * 900000)}`,
                        role: 'assistant',
                        content: `Hi! I'm your AI Marketing Assistant. Tell me about your business so I can help you with your marketing needs.`
                    };

                    if (setMessages) {
                        setMessages([welcomeMessage]);
                    }
                }
            }
        };

        if (openkbs && !profileChecked) {
            initializeChat();
        }
    }, [messages, setMessages, openkbs, profileChecked]);

    return (
        <>
            {/* Panel Button - only show when not expanded */}
            {!panelExpanded && (
                <IconButton
                    onClick={() => setPanelExpanded(true, 'files')}
                    sx={{
                        position: 'absolute',
                        top: window.innerWidth < 960 ? '70px' : '90px',
                        left: window.innerWidth < 960 ? '20px' : '340px',
                        backgroundColor: 'white',
                        color: 'primary.main',
                        width: 40,
                        height: 40,
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                            backgroundColor: '#f5f5f5',
                            transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s',
                        zIndex: 1200
                    }}
                >
                    <TuneIcon fontSize="small" />
                </IconButton>
            )}

            {/* Agent Panel */}
            {panelExpanded && openkbs && (
                <AgentPanel
                    openkbs={openkbs}
                    initialTab={initialTab}
                    onTabChange={(tab) => setPanelExpanded(true, tab === 0 ? 'files' : tab === 1 ? 'memory' : 'access')}
                    onClose={() => setPanelExpanded(false)}
                    setSystemAlert={setSystemAlert}
                    setBlockingLoading={setBlockingLoading}
                />
            )}
        </>
    );
};

export default Header;