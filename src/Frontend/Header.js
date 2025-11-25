import React, { useEffect, useState } from 'react';
import { isContentHTML } from "./utils";

const getChatId = () => window?.location?.pathname?.split('/chat/')?.[1];

const checkBusinessProfileExists = async (openkbs) => {
    try {
        const response = await openkbs.getItem('memory_business_profile');
        return !!response?.item;
    } catch (e) {
        return false;
    }
};

const Header = ({ setRenderSettings, messages, setMessages, openkbs }) => {
    const [profileChecked, setProfileChecked] = useState(false);

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
                        content: `Welcome! I'm your AI Marketing Assistant 🚀

I can help you with:
• Creating compelling content and campaigns
• Generating professional images and videos
• Building landing pages and marketing materials
• Planning your social media strategy

To provide the best recommendations for YOUR specific needs, let's start with a quick intro.

**Tell me about your business - what makes it unique?**

💡 *Tip: The more details you share, the better I can tailor my suggestions!*`
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

    return null; // No UI components needed
};

export default Header;