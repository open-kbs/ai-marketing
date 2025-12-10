import React from 'react';
import ImageWithDownload from './ImageWithDownload';
import CommandRenderer from './CommandRenderer';
import Header from './Header';
import MultiContentRenderer from './MultiContentRenderer';
import { COMMAND_PATTERNS } from './commands';

const HIDDEN = JSON.stringify({ type: 'HIDDEN_MESSAGE' });

const isVisualResult = (r) => {
    return (r?.type === 'CHAT_IMAGE' && r?.data?.imageUrl) ||
           (r?.type === 'CHAT_VIDEO' && r?.data?.videoUrl) ||
           r?.type === 'VIDEO_PENDING';
};

const getQueryParamValue = (paramName) => {
    return new URLSearchParams(window.location.search).get(paramName);
};

const renderVisualResults = (results) => {
    const visuals = results.filter(isVisualResult);
    if (visuals.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxWidth: '100%' }}>
            {visuals.map((item, idx) => {
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
};

const onRenderChatMessage = async (params) => {
    const { content, role } = params.messages[params.msgIndex];
    const { msgIndex, messages, markdownHandler } = params;

    if (getQueryParamValue('debug')) return null;

    let JSONData;
    try {
        JSONData = JSON.parse(content);
    } catch (e) {}

    // Multi-content array with images (for LLM vision)
    if (Array.isArray(JSONData) && JSONData.some(item => item.type === 'image_url')) {
        return <MultiContentRenderer content={JSONData} />;
    }

    if (JSONData?.type === 'CONTINUE') {
        return HIDDEN;
    }

    // Handle RESPONSE type - unified response format
    if (JSONData?.type === 'RESPONSE' && Array.isArray(JSONData?.results)) {
        const hasVisual = JSONData.results.some(isVisualResult);
        if (hasVisual) {
            return renderVisualResults(JSONData.results);
        }
    }

    // System response to command - hide if previous message had command
    if (role === 'system' && JSONData &&
        (JSONData._meta_type === 'EVENT_STARTED' || JSONData._meta_type === 'EVENT_FINISHED')) {

        const hasVisual = JSONData.type === 'RESPONSE' &&
                          Array.isArray(JSONData.results) &&
                          JSONData.results.some(isVisualResult);

        if (!hasVisual && msgIndex > 0) {
            const prevMessage = messages[msgIndex - 1];
            if (COMMAND_PATTERNS.some(pattern => pattern.test(prevMessage.content))) {
                return HIDDEN;
            }
        }
    }

    // Message with commands - render with CommandRenderer
    if (COMMAND_PATTERNS.some(pattern => pattern.test(content))) {
        let responseData = null;

        if (msgIndex < messages.length - 1) {
            const nextMessage = messages[msgIndex + 1];
            if (nextMessage.role === 'system') {
                try {
                    const nextJSON = JSON.parse(nextMessage.content);
                    if (nextJSON._meta_type === 'EVENT_STARTED' || nextJSON._meta_type === 'EVENT_FINISHED') {
                        responseData = nextJSON;
                    }
                } catch (e) {}
            }
        }

        return <CommandRenderer content={content} responseData={responseData} markdownHandler={markdownHandler} />;
    }

    return null;
};

const exports = {onRenderChatMessage, Header};
window.contentRender = exports;
export default exports;