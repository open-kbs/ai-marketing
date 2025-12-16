// Import helpers
import { getSora2PromptingGuide } from './sora2PromptingGuide.js';
import { webPublishingGuide } from './webPublishingGuide.js';
import {
  setMemoryValue,
  deleteItem
} from './memoryHelpers.js';


// Common function for uploading generated images
const uploadGeneratedImage = async (base64Data, meta) => {
    const fileName = `image-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const uploadResult = await openkbs.uploadImage(base64Data, fileName, 'image/png');

    return {
        type: 'CHAT_IMAGE',
        data: { imageUrl: uploadResult.url },
        ...meta
    };
};

export const getActions = (meta, event) => [
    // Sora 2 Prompting Guide
    [/<getSora2PromptingGuide\s*\/>/s, async () => {
        return { ...getSora2PromptingGuide(), ...meta };
    }],

    // Web Publishing Guide
    [/<getWebPublishingGuide\s*\/>/s, async () => {
        return {
            type: 'WEB_PUBLISHING_GUIDE',
            content: webPublishingGuide,
            ...meta
        };
    }],

    // Memory Management Commands with JSON
    [/<setMemory>([\s\S]*?)<\/setMemory>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            // Validate itemId starts with memory_
            if (!data.itemId?.startsWith('memory_')) {
                return {
                    type: "MEMORY_ERROR",
                    error: "ItemId must start with 'memory_'",
                    _meta_actions: ["REQUEST_CHAT_MODEL"]
                };
            }

            // Use atomic memory operation
            await setMemoryValue(data.itemId, data.value, data.expirationInMinutes);

            return {
                type: "MEMORY_UPDATED",
                itemId: data.itemId,
                expires: data.expirationInMinutes ? `in ${data.expirationInMinutes} minutes` : 'never',
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        } catch (e) {
            return {
                type: "MEMORY_ERROR",
                error: e.message,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        }
    }],

    [/<deleteItem>([\s\S]*?)<\/deleteItem>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            const result = await deleteItem(data.itemId);

            if (!result.success) {
                return {
                    type: "DELETE_ERROR",
                    error: result.error || "Failed to delete item",
                    _meta_actions: ["REQUEST_CHAT_MODEL"]
                };
            }

            return {
                type: "ITEM_DELETED",
                itemId: data.itemId,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        } catch (e) {
            return {
                type: "DELETE_ERROR",
                error: e.message,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        }
    }],

    // AI Image Generation with JSON
    [/<createAIImage>([\s\S]*?)<\/createAIImage>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            const model = data.model || "gemini-2.5-flash-image";
            const prompt = data.prompt;
            const imageUrls = data.imageUrls || [];
            const aspect_ratio = data.aspect_ratio;
            const size = data.size;

            // Build parameters based on model
            const params = {
                model: model,
                n: 1
            };

            // Add image URLs if provided
            if (imageUrls.length > 0) {
                params.imageUrls = imageUrls;
            }

            // Handle model-specific parameters
            if (model === 'gpt-image-1') {
                const validSizes = ["1024x1024", "1536x1024", "1024x1536", "auto"];
                params.size = validSizes.includes(size) ? size : "1024x1024";
                params.quality = "high";
            } else if (model === 'gemini-2.5-flash-image') {
                const validAspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
                params.aspect_ratio = validAspectRatios.includes(aspect_ratio) ? aspect_ratio : "1:1";
            }

            const image = await openkbs.generateImage(prompt, params);
            return await uploadGeneratedImage(image[0].b64_json, meta);
        } catch (error) {
            return { error: error.message || 'Image creation failed', ...meta };
        }
    }],

    // Video generation with JSON
    [/<createAIVideo>([\s\S]*?)<\/createAIVideo>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            const videoModel = data.model || "sora-2";
            const size = data.size || '1280x720';
            const seconds = data.seconds || 8;
            const prompt = data.prompt;
            const referenceImageUrl = data.input_reference_url;

            // Validate seconds
            const validSeconds = [4, 8, 12];
            const finalSeconds = validSeconds.includes(seconds) ? seconds :
                                validSeconds.reduce((prev, curr) =>
                                    Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev);

            const params = {
                video_model: videoModel,
                seconds: finalSeconds
            };

            if (referenceImageUrl) {
                params.input_reference_url = referenceImageUrl;
            } else if (size) {
                const validSizes = ['720x1280', '1280x720'];
                params.size = validSizes.includes(size) ? size : '1280x720';
            }

            const videoData = await openkbs.generateVideo(prompt, params);

            if (videoData && videoData[0] && videoData[0].status === 'pending') {
                return {
                    type: 'VIDEO_PENDING',
                    data: {
                        videoId: videoData[0].video_id,
                        message: '⏳ Video generation in progress. Please wait and DO NOT refresh your browser! Use continueVideoPolling to check status.'
                    },
                    ...meta
                };
            }

            if (videoData && videoData[0] && videoData[0].video_url) {
                return {
                    type: 'CHAT_VIDEO',
                    data: { videoUrl: videoData[0].video_url },
                    ...meta
                };
            } else {
                return { error: 'Video generation failed - no video URL returned', ...meta };
            }
        } catch (error) {
            return { error: error.message || 'Video creation failed', ...meta };
        }
    }],

    [/<continueVideoPolling>([\s\S]*?)<\/continueVideoPolling>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);
            const videoId = data.videoId;

            const videoData = await openkbs.checkVideoStatus(videoId);

            if (videoData && videoData[0]) {
                if (videoData[0].status === 'completed' && videoData[0].video_url) {
                    return {
                        type: 'CHAT_VIDEO',
                        data: { videoUrl: videoData[0].video_url },
                        ...meta
                    };
                } else if (videoData[0].status === 'pending') {
                    return {
                        type: 'VIDEO_PENDING',
                        data: {
                            videoId: videoId,
                            message: '⏳ Video still generating. Please wait and DO NOT refresh your browser! Continue polling.'
                        },
                        ...meta
                    };
                } else if (videoData[0].status === 'failed') {
                    return { error: 'Video generation failed', ...meta };
                }
            }

            return { error: 'Unable to get video status', ...meta };
        } catch (error) {
            return { error: error.message || 'Failed to check video status', ...meta };
        }
    }],

    // Web Page Publishing (for landing pages and marketing materials)
    [/<publishWebPage>([\s\S]*?)<\/publishWebPage>/s, async (match) => {
        try {
            let htmlContent = match[1].trim();

            // Extract title from HTML for filename
            const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1] : 'Marketing Page';

            // Create safe filename from title with timestamp
            const timestamp = Date.now();
            const baseFilename = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'page';
            const filename = `${baseFilename}_${timestamp}.html`;

            // Get presigned URL for upload - returns URL string directly
            const presignedUrl = await openkbs.kb({
                action: 'createPresignedURL',
                namespace: 'files',
                fileName: filename,
                fileType: 'text/html',
                presignedOperation: 'putObject'
            });

            // Upload HTML content using axios (globally available in OpenKBS)
            const htmlBuffer = Buffer.from(htmlContent, 'utf8');
            const uploadResponse = await axios.put(presignedUrl, htmlBuffer, {
                headers: {
                    'Content-Type': 'text/html',
                    'Content-Length': htmlBuffer.length
                }
            });

            if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
                throw new Error(`Upload failed with status ${uploadResponse.status}`);
            }

            // Construct public URL - same pattern as firebrigade1
            const publicUrl = `https://web.file.vpc1.us/files/${openkbs.kbId}/${filename}`;

            return {
                type: 'WEB_PAGE_PUBLISHED',
                data: {
                    url: publicUrl,
                    filename: filename,
                    title: title,
                    message: `Website published successfully at ${publicUrl}`
                },
                ...meta
            };
        } catch (error) {
            return {
                type: 'PUBLISH_ERROR',
                error: error.message || 'Failed to publish web page',
                ...meta
            };
        }
    }],

    // Load image into LLM vision context for analysis
    [/<viewImage>([\s\S]*?)<\/viewImage>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);
            const imageUrl = data.url;

            return {
                data: [
                    { type: "text", text: `Image loaded for analysis: ${imageUrl}` },
                    { type: "image_url", image_url: { url: imageUrl } }
                ],
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        } catch (e) {
            return {
                type: "VIEW_IMAGE_ERROR",
                error: e.message,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        }
    }],

    // Web scraping with JSON
    [/<webpageToText>([\s\S]*?)<\/webpageToText>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            let response = await openkbs.webpageToText(data.url, { parsePrice: true });
            if (response?.content?.length > 5000) {
                response.content = response.content.substring(0, 5000);
            }
            return { data: response, ...meta };
        } catch (e) {
            return { error: e.response?.data || e.message, ...meta };
        }
    }],

    // Google Search with JSON
    [/<googleSearch>([\s\S]*?)<\/googleSearch>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);
            const query = data.query;

            const response = await openkbs.googleSearch(query);

            const results = response?.map(({ title, link, snippet, pagemap }) => ({
                title,
                link,
                snippet,
                image: pagemap?.metatags?.[0]?.["og:image"]
            }));

            return { data: results, ...meta };
        } catch (e) {
            return { error: e.response?.data || e.message, ...meta };
        }
    }],

    // Google Image Search with JSON
    [/<googleImageSearch>([\s\S]*?)<\/googleImageSearch>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);
            const query = data.query;
            const limit = data.limit || 10;

            const response = await openkbs.googleSearch(query, { searchType: 'image' });

            const results = response?.map(({ title, link, snippet, pagemap }) => {
                const imageObj = pagemap?.cse_image?.[0];
                const thumbnail = imageObj?.src || pagemap?.metatags?.[0]?.["og:image"] || link;
                return {
                    title,
                    link,
                    snippet,
                    image: thumbnail
                };
            })?.slice(0, limit);

            return { data: results, ...meta };
        } catch (e) {
            return { error: e.response?.data || e.message, ...meta };
        }
    }],

    // Deep Research - autonomous multi-step research agent (takes 5-60 minutes)
    // Requires minimum upfront charge of 50 credits (~€0.50)
    [/<deepResearch>([\s\S]*?)<\/deepResearch>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            const input = data.query || data.input;
            const previousInteractionId = data.previous_interaction_id;

            if (!input) {
                return { error: 'Missing query/input for deep research', ...meta };
            }

            const params = {};
            if (previousInteractionId) {
                params.previous_interaction_id = previousInteractionId;
            }

            const researchData = await openkbs.deepResearch(input, params);

            if (researchData?.status === 'in_progress') {
                return {
                    type: 'DEEP_RESEARCH_PENDING',
                    data: {
                        interactionId: researchData.interaction_id,
                        prepaidCredits: researchData.prepaid_credits,
                        message: '🔬 Deep research in progress. This may take 5-20 minutes. Use continueDeepResearchPolling to check status.'
                    },
                    ...meta
                };
            }

            if (researchData?.status === 'completed' && researchData?.output) {
                return {
                    type: 'DEEP_RESEARCH_COMPLETED',
                    data: {
                        interactionId: researchData.interaction_id,
                        output: researchData.output,
                        usage: researchData.usage
                    },
                    ...meta
                };
            }

            return { error: 'Deep research failed - unexpected response', ...meta };
        } catch (error) {
            return { error: error.message || 'Deep research failed', ...meta };
        }
    }],

    [/<continueDeepResearchPolling>([\s\S]*?)<\/continueDeepResearchPolling>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);
            const interactionId = data.interactionId;
            const prepaidCredits = data.prepaidCredits || 0;

            if (!interactionId) {
                return { error: 'Missing interactionId for deep research polling', ...meta };
            }

            const researchData = await openkbs.checkDeepResearchStatus(interactionId, prepaidCredits);

            if (researchData?.status === 'completed' && researchData?.output) {
                return {
                    type: 'DEEP_RESEARCH_COMPLETED',
                    data: {
                        interactionId: researchData.interaction_id,
                        output: researchData.output,
                        usage: researchData.usage
                    },
                    ...meta
                };
            } else if (researchData?.status === 'in_progress') {
                return {
                    type: 'DEEP_RESEARCH_PENDING',
                    data: {
                        interactionId: interactionId,
                        prepaidCredits: researchData.prepaid_credits,
                        message: '🔬 Deep research still in progress. Please wait and continue polling.'
                    },
                    ...meta
                };
            } else if (researchData?.status === 'failed') {
                return { error: 'Deep research failed', ...meta };
            }

            return { error: 'Unable to get deep research status', ...meta };
        } catch (error) {
            return { error: error.message || 'Failed to check deep research status', ...meta };
        }
    }],

    // Email sending with JSON
    [/<sendMail>([\s\S]*?)<\/sendMail>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            const response = await openkbs.sendMail(data.to, data.subject, data.body);
            return {
                type: 'EMAIL_SENT',
                data: {
                    email: data.to,
                    subject: data.subject,
                    response
                },
                ...meta
            };
        } catch (e) {
            return { error: e.response?.data || e.message, ...meta };
        }
    }],

    // Scheduled Tasks with JSON
    [/<scheduleTask>([\s\S]*?)<\/scheduleTask>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            let scheduledTime;

            if (data.time) {
                // Parse specific time
                let isoTimeStr = data.time.replace(' ', 'T');
                if (!isoTimeStr.includes('Z') && !isoTimeStr.includes('+') && !isoTimeStr.includes('-')) {
                    isoTimeStr += 'Z';
                }
                scheduledTime = new Date(isoTimeStr).getTime();
            } else if (data.delay) {
                // Parse delay
                let delayMs = 0;
                const delayStr = data.delay;
                if (delayStr.endsWith('h')) {
                    delayMs = parseFloat(delayStr) * 60 * 60 * 1000;
                } else if (delayStr.endsWith('d')) {
                    delayMs = parseFloat(delayStr) * 24 * 60 * 60 * 1000;
                } else {
                    delayMs = parseFloat(delayStr) * 60 * 1000;
                }
                scheduledTime = Date.now() + delayMs;
            } else {
                scheduledTime = Date.now() + (60 * 60 * 1000);
            }

            scheduledTime = Math.floor(scheduledTime / 60000) * 60000;

            const response = await openkbs.kb({
                action: 'createScheduledTask',
                scheduledTime: scheduledTime,
                taskPayload: {
                    message: `[SCHEDULED_TASK] ${data.message}`,
                    source: 'marketing_agent_scheduled',
                    createdAt: Date.now()
                },
                description: `Marketing task: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`
            });

            return {
                type: 'TASK_SCHEDULED',
                data: {
                    scheduledTime: new Date(scheduledTime).toISOString(),
                    taskId: response.taskId,
                    message: data.message
                },
                ...meta
            };
        } catch (e) {
            return { error: e.response?.data || e.message || 'Failed to schedule task', ...meta };
        }
    }],

    [/<getScheduledTasks\/>/s, async () => {
        try {
            const response = await openkbs.kb({
                action: 'getScheduledTasks'
            });

            return {
                type: 'SCHEDULED_TASKS_LIST',
                data: response,
                ...meta
            };
        } catch (e) {
            return { error: e.response?.data || e.message || 'Failed to get scheduled tasks', ...meta };
        }
    }],

    [/<deleteScheduledTask>([\s\S]*?)<\/deleteScheduledTask>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            const response = await openkbs.kb({
                action: 'deleteScheduledTask',
                timestamp: data.timestamp
            });

            return {
                type: 'TASK_DELETED',
                data: {
                    deletedTimestamp: data.timestamp,
                    message: 'Task deleted successfully'
                },
                ...meta
            };
        } catch (e) {
            return { error: e.response?.data || e.message || 'Failed to delete task', ...meta };
        }
    }],

    // Archive items to long-term memory (VectorDB)
    [/<archiveItems>([\s\S]*?)<\/archiveItems>/s, async (match) => {
        try {
            const content = match[1].trim();
            const itemIds = JSON.parse(content);

            if (!Array.isArray(itemIds) || itemIds.length === 0) {
                throw new Error('Must provide an array of itemIds to archive');
            }

            const results = [];
            const embeddingModel = 'text-embedding-3-large';
            const embeddingDimension = 3072;
            const timestamp = Date.now();

            for (const itemId of itemIds) {
                try {
                    // 1. Fetch the original item
                    const originalItem = await openkbs.getItem(itemId);
                    if (!originalItem?.item?.body) {
                        results.push({ itemId, status: 'error', error: 'Item not found' });
                        continue;
                    }

                    const body = originalItem.item.body;
                    const originalItemType = itemId.split('_')[0]; // memory, agent, etc.

                    // 2. Build embedding text based on item type
                    let embeddingText = '';
                    if (originalItemType === 'memory') {
                        // Memory item format
                        embeddingText = `${itemId}: ${typeof body.value === 'string' ? body.value : JSON.stringify(body.value)}`;
                    } else {
                        // Generic format
                        embeddingText = `${itemId}: ${JSON.stringify(body)}`;
                    }

                    // 3. Create embeddings
                    const { embeddings, totalTokens } = await openkbs.createEmbeddings(embeddingText, embeddingModel);

                    // 4. Create archive item with timestamp for uniqueness
                    const archiveItemId = `archive_${timestamp}_${itemId}`;
                    const archiveBody = {
                        originalItemId: itemId,
                        originalItemType: originalItemType,
                        content: body,
                        archivedAt: new Date().toISOString()
                    };

                    await openkbs.items({
                        action: 'createItem',
                        itemType: 'archive',
                        itemId: archiveItemId,
                        attributes: [
                            { attrType: 'itemId', attrName: 'itemId', encrypted: false },
                            { attrType: 'body', attrName: 'body', encrypted: true }
                        ],
                        item: { body: await openkbs.encrypt(JSON.stringify(archiveBody)) },
                        totalTokens,
                        embeddings: embeddings ? embeddings.slice(0, embeddingDimension) : undefined,
                        embeddingModel,
                        embeddingDimension
                    });

                    // 5. Delete original item from priority storage
                    await deleteItem(itemId);

                    results.push({
                        itemId,
                        archiveItemId,
                        status: 'success',
                        tokens: totalTokens
                    });

                } catch (e) {
                    results.push({ itemId, status: 'error', error: e.message });
                }
            }

            const successCount = results.filter(r => r.status === 'success').length;
            const errorCount = results.filter(r => r.status === 'error').length;

            return {
                type: "ITEMS_ARCHIVED",
                summary: `Archived ${successCount} of ${itemIds.length} items (${errorCount} errors)`,
                results,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        } catch (e) {
            return {
                type: "ARCHIVE_ERROR",
                error: e.message,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        }
    }],

    // Search long-term archive memory (VectorDB semantic search)
    [/<searchArchive>([\s\S]*?)<\/searchArchive>/s, async (match) => {
        try {
            const content = match[1].trim();
            const data = JSON.parse(content);

            if (!data.query) {
                throw new Error('Must provide a "query" for semantic search');
            }

            const topK = data.topK || 10;
            const minScore = data.minScore || 0;

            // Call VectorDB search via openkbs.items
            const searchResult = await openkbs.items({
                action: 'searchVectorDBItems',
                queryText: data.query,
                topK: topK,
                minScore: minScore
            });

            // Format and decrypt results
            const formattedResults = [];

            for (const item of (searchResult?.items || [])) {
                try {
                    // The body field is encrypted - decrypt it
                    let parsed = null;
                    if (item.body) {
                        const decryptedBody = await openkbs.decrypt(item.body);
                        parsed = JSON.parse(decryptedBody);
                    }

                    formattedResults.push({
                        archiveItemId: item.itemId,
                        originalItemId: parsed?.originalItemId,
                        originalItemType: parsed?.originalItemType,
                        content: parsed?.content,
                        archivedAt: parsed?.archivedAt,
                        score: item.score
                    });
                } catch (e) {
                    // If decryption fails, include item with error
                    formattedResults.push({
                        archiveItemId: item.itemId,
                        score: item.score,
                        error: 'Failed to decrypt: ' + e.message
                    });
                }
            }

            return {
                type: "ARCHIVE_SEARCH_RESULTS",
                query: data.query,
                count: formattedResults.length,
                results: formattedResults,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        } catch (e) {
            return {
                type: "ARCHIVE_SEARCH_ERROR",
                error: e.message,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        }
    }]
];