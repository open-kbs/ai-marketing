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
           r?.type === 'VIDEO_PENDING' ||
           r?.type === 'DEEP_RESEARCH_PENDING' ||
           r?.type === 'DEEP_RESEARCH_COMPLETED';
};

const getQueryParamValue = (paramName) => {
    return new URLSearchParams(window.location.search).get(paramName);
};

const DeepResearchResult = ({ data }) => {
    const [expanded, setExpanded] = React.useState(false);
    const output = data?.output || '';
    const usage = data?.usage || {};
    const previewLength = 500;
    const needsExpand = output.length > previewLength;

    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            padding: 16,
            maxWidth: '100%'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid #e0e0e0'
            }}>
                <span style={{ fontSize: 24 }}>🔬</span>
                <span style={{ fontWeight: 600, fontSize: 16, color: '#1565c0' }}>Deep Research Complete</span>
                {usage.input_tokens !== undefined && (
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        color: '#666',
                        backgroundColor: '#e3f2fd',
                        padding: '2px 8px',
                        borderRadius: 4
                    }}>
                        {((usage.input_tokens || 0) + (usage.output_tokens || 0)).toLocaleString()} tokens
                    </span>
                )}
            </div>
            <div style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
            }}>
                {expanded ? output : output.substring(0, previewLength) + (needsExpand ? '...' : '')}
            </div>
            {needsExpand && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        marginTop: 12,
                        padding: '6px 16px',
                        backgroundColor: '#1565c0',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500
                    }}
                >
                    {expanded ? 'Show Less' : 'Show Full Report'}
                </button>
            )}
        </div>
    );
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
                if (item?.type === 'DEEP_RESEARCH_COMPLETED' && item?.data) {
                    return (
                        <div key={`research-${idx}`} style={{ flex: '1 1 100%' }}>
                            <DeepResearchResult data={item.data} />
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