import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    LinearProgress
} from '@mui/material';
import {
    extractHTMLContent,
    generateFilename,
    getBaseURL
} from "./utils";

const SimpleHTMLPreview = ({ htmlContent, params }) => {
    const previewRef = useRef(null);
    const { msgIndex, messages, setMessages, chatAPI, KB, uploadFileAPI, setBlockingLoading } = params;

    const [isPublishing, setIsPublishing] = useState(false);

    const uploadHTMLContent = useCallback(async (htmlContent) => {
        const html = extractHTMLContent(htmlContent);
        if (!html) return;
        try {
            const blob = new Blob([html], { type: 'text/html' });
            const file = new File([blob], generateFilename(htmlContent), { type: 'text/html' });
            const res = await uploadFileAPI(file, 'files')
            return getBaseURL(KB) + decodeURIComponent(res?.config.url.split('/').pop().split('?')[0]);
        } catch (e) {
            console.error('Error during upload:', e);
        }
    }, [uploadFileAPI, KB]);

    const handlePublish = async () => {
        const html = extractHTMLContent(htmlContent);
        if (!html) return;

        try {
            setIsPublishing(true);
            setBlockingLoading({text: "Publishing website"});
            const url = await uploadHTMLContent(htmlContent);
            if (url) {
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error('Error publishing:', e);
        } finally {
            setIsPublishing(false);
            setBlockingLoading(false);
        }
    };

    useEffect(() => {
        if (previewRef.current && htmlContent) {
            const html = extractHTMLContent(htmlContent);
            if (html) {
                const iframe = previewRef.current.querySelector('iframe');
                if (iframe) {
                    iframe.srcdoc = html;
                }
            }
        }
    }, [htmlContent]);

    const loaderStyle = { position: 'absolute', top: 14, left: 0, right: 0, height: 2, zIndex: 1000 };

    return (
        <>
            <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
                {isPublishing && (<LinearProgress style={loaderStyle} />)}
            </div>
            <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '10px',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Website Preview</span>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        style={{
                            color: '#ffffff',
                            backgroundColor: isPublishing ? '#ccc' : '#28a745',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: isPublishing ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
                <div ref={previewRef} style={{ height: '600px', width: '100%' }}>
                    <iframe
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        sandbox="allow-scripts allow-same-origin"
                        srcdoc={extractHTMLContent(htmlContent) || ''}
                    />
                </div>
            </div>
        </>
    );
};

export default SimpleHTMLPreview;