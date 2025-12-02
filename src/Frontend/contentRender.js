import React from 'react';
import {
    extractHTMLContent,
    isContentHTML
} from "./utils";
import ImageWithDownload from './ImageWithDownload';
import CommandRenderer from './CommandRenderer';
import SimpleHTMLPreview from './SimpleHTMLPreview';
import Header from './Header';
import MultiContentRenderer from './MultiContentRenderer';

// Common command patterns used throughout the app
const COMMAND_PATTERNS = [
    /<getSora2PromptingGuide\s*\/>/,
    /<getWebPublishingGuide\s*\/>/,
    /<createAIImage>[\s\S]*?<\/createAIImage>/,
    /<createAIVideo>[\s\S]*?<\/createAIVideo>/,
    /<continueVideoPolling>[\s\S]*?<\/continueVideoPolling>/,
    /<publishWebPage>[\s\S]*?<\/publishWebPage>/,
    /<sendMail>[\s\S]*?<\/sendMail>/,
    /<googleSearch>[\s\S]*?<\/googleSearch>/,
    /<googleImageSearch>[\s\S]*?<\/googleImageSearch>/,
    /<viewImage>[\s\S]*?<\/viewImage>/,
    /<webpageToText>[\s\S]*?<\/webpageToText>/,
    /<setMemory>[\s\S]*?<\/setMemory>/,
    /<deleteItem>[\s\S]*?<\/deleteItem>/,
    /<cleanupMemory\s*\/>/,
    /<scheduleTask>[\s\S]*?<\/scheduleTask>/,
    /<getScheduledTasks\s*\/>/,
    /<deleteScheduledTask>[\s\S]*?<\/deleteScheduledTask>/
];

export function getQueryParamValue(paramName) {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(paramName);
}

const onRenderChatMessage = async (params) => {
    let { content, role } = params.messages[params.msgIndex];
    const { initDB, KB, msgIndex, messages, markdownHandler } = params;

    if (getQueryParamValue('debug')) return;

    let JSONData;

    // Try to parse JSON from message content
    try {
        JSONData = JSON.parse(content);
    } catch (e) {
        // Content is not JSON, continue with normal processing
    }

    if (Array.isArray(JSONData)) {
        const hasImages = JSONData.some(item => item.type === 'image_url');
        if (hasImages) return <MultiContentRenderer content={JSONData} />;
    }

    // Hide CONTINUE type system messages - they are service messages
    if (JSONData?.type === 'CONTINUE') {
        return JSON.stringify({ type: 'HIDDEN_MESSAGE' });
    }

    // Check if this is a system response to a previous command
    if (role === 'system' && JSONData &&
        (JSONData._meta_type === 'EVENT_STARTED' || JSONData._meta_type === 'EVENT_FINISHED')) {

        // Don't hide special response types that have their own rendering
        const hasSpecialRendering = (JSONData.type === 'CHAT_IMAGE' && JSONData.data?.imageUrl) ||
                                    (JSONData.type === 'CHAT_VIDEO' && JSONData.data?.videoUrl) ||
                                    (JSONData.type === 'VISUAL_MULTI_RESPONSE' && Array.isArray(JSONData.data));

        if (!hasSpecialRendering) {
            // Check if previous message had a command
            if (msgIndex > 0) {
                const prevMessage = messages[msgIndex - 1];
                const prevHasCommand = COMMAND_PATTERNS.some(pattern => pattern.test(prevMessage.content));

                // If previous message had a command, hide this system message
                // as it's already shown in the command widget
                if (prevHasCommand) {
                    return JSON.stringify({ type: 'HIDDEN_MESSAGE' });
                }
            }
        }
    }

    // Handle CHAT_IMAGE type JSON data
    if (JSONData?.type === 'CHAT_IMAGE' && JSONData?.data?.imageUrl) {
        return <ImageWithDownload imageUrl={JSONData.data.imageUrl} />;
    }

    // Handle CHAT_VIDEO type JSON data
    if (JSONData?.type === 'CHAT_VIDEO' && JSONData?.data?.videoUrl) {
        return (
            <video
                src={JSONData.data.videoUrl}
                controls
                style={{ width: '100%', maxWidth: 600, borderRadius: 8 }}
            />
        );
    }

    // Handle VISUAL_MULTI_RESPONSE - multiple images/videos generated in parallel
    if (JSONData?.type === 'VISUAL_MULTI_RESPONSE' && Array.isArray(JSONData?.data)) {
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxWidth: '100%' }}>
                {JSONData.data.map((item, idx) => {
                    if (item?.type === 'CHAT_IMAGE' && item?.data?.imageUrl) {
                        return (
                            <div key={`img-${idx}`} style={{ flex: '1 1 calc(50% - 6px)', minWidth: 200, maxWidth: 400 }}>
                                <ImageWithDownload imageUrl={item.data.imageUrl} />
                            </div>
                        );
                    }
                    if (item?.type === 'CHAT_VIDEO' && item?.data?.videoUrl) {
                        return (
                            <div key={`vid-${idx}`} style={{ flex: '1 1 100%' }}>
                                <video
                                    src={item.data.videoUrl}
                                    controls
                                    style={{ width: '100%', maxWidth: 600, borderRadius: 8 }}
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    }

    // Check if content contains any command tags
    const hasCommand = COMMAND_PATTERNS.some(pattern => pattern.test(content));

    // If content contains commands, check for response in next message
    if (hasCommand) {
        let responseData = null;

        // Check if next message is a system response
        if (msgIndex < messages.length - 1) {
            const nextMessage = messages[msgIndex + 1];
            if (nextMessage.role === 'system') {
                try {
                    const nextJSON = JSON.parse(nextMessage.content);
                    if (nextJSON._meta_type === 'EVENT_STARTED' || nextJSON._meta_type === 'EVENT_FINISHED') {
                        responseData = nextJSON;
                    }
                } catch (e) {
                    // Not JSON, ignore
                }
            }
        }

        return <CommandRenderer content={content} responseData={responseData} markdownHandler={markdownHandler} />;
    }

    return null;
};

const exports = {onRenderChatMessage, Header};
window.contentRender = exports;
export default exports;