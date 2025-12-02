import {getActions} from './actions.js';

export const backendHandler = async (event) => {
    const lastMessage = event.payload.messages[event.payload.messages.length - 1];
    const actions = getActions({_meta_actions: ["REQUEST_CHAT_MODEL"]}, event);

    // Find all matching actions and categorize them
    const awaitActions = [];
    const otherActions = [];

    actions.forEach(([regex, action]) => {
        const matches = [...(lastMessage.content || '').matchAll(new RegExp(regex, 'g'))];
        matches.forEach(match => {
            // Check if this is an await command - needs to be executed first
            if (regex.toString().includes('awaitNextFrame')) {
                awaitActions.push(action(match, event));
            } else {
                otherActions.push(action(match, event));
            }
        });
    });

    const matchingActions = [...awaitActions, ...otherActions];

    // Execute actions - await first if present, then others in parallel
    if (matchingActions.length > 0) {
        try {
            let results = [];

            // Execute await commands sequentially first if any
            if (awaitActions.length > 0) {
                for (const awaitAction of awaitActions) {
                    const awaitResult = await awaitAction;
                    results.push(awaitResult);
                }
            }

            // Then execute all other commands in parallel
            if (otherActions.length > 0) {
                const otherResults = await Promise.all(otherActions);
                results.push(...otherResults);
            }

            // Check if any result needs LLM callback
            const needsChatModel = results.some(r =>
                r?._meta_actions?.includes('REQUEST_CHAT_MODEL')
            );

            // Check for visual output types that should NOT be merged
            const isVisualOutput = (r) =>
                r?.type === 'CHAT_IMAGE' ||
                r?.type === 'CHAT_VIDEO' ||
                r?.type === 'VIDEO_PENDING';

            const hasVisualOutput = results.some(isVisualOutput);

            // If we have visual outputs, return them directly without wrapping
            if (hasVisualOutput) {
                // Single visual result - return as is
                if (results.length === 1) {
                    return results[0];
                }

                // Multiple results with visual - return each visual separately
                // For now, return first visual result (frontend will render it)
                const visualResults = results.filter(isVisualOutput);
                const otherResults = results.filter(r => !isVisualOutput(r));

                // If only visual results, return them as array for frontend to render
                if (otherResults.length === 0) {
                    return {
                        type: 'VISUAL_MULTI_RESPONSE',
                        data: visualResults,
                        _meta_actions: needsChatModel ? ["REQUEST_CHAT_MODEL"] : []
                    };
                }

                // Mixed results - return visual first, then others as text
                return {
                    type: 'VISUAL_MULTI_RESPONSE',
                    data: visualResults,
                    otherData: otherResults,
                    _meta_actions: needsChatModel ? ["REQUEST_CHAT_MODEL"] : []
                };
            }

            // If we have image data (for LLM vision), merge arrays and aggregate others
            const hasImageData = results.some(r => r?.data?.some?.(item => item?.type === 'image_url'));

            if (hasImageData) {
                // Helper to detect content arrays (array with at least one image_url)
                const isContentArray = (result) => {
                    return Array.isArray(result?.data) && result.data.some(item => item?.type === 'image_url');
                };

                // Merge all content arrays
                const mergedData = results.reduce((acc, result) => {
                    if (isContentArray(result)) {
                        acc.push(...result.data);
                    }
                    return acc;
                }, []);

                // Collect all non-content-array results
                const nonContentResults = results.filter(r => !isContentArray(r));

                // Convert other results to text objects and push
                if (nonContentResults.length > 0) {
                    nonContentResults.forEach(result => {
                        mergedData.push({
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        });
                    });
                }

                return {
                    data: mergedData,
                    _meta_actions: needsChatModel ? ["REQUEST_CHAT_MODEL"] : []
                };
            }

            // Return results array for multiple actions
            if (results.length > 1) {
                return {
                    type: 'MULTI_RESPONSE',
                    data: results,
                    _meta_actions: needsChatModel ? ["REQUEST_CHAT_MODEL"] : []
                };
            }

            // Single result - return as is
            return {
                type: 'API_RESPONSE',
                data: results[0],
                _meta_actions: needsChatModel ? ["REQUEST_CHAT_MODEL"] : []
            };

        } catch (error) {
            return {
                type: 'ERROR',
                error: error.message,
                _meta_actions: ["REQUEST_CHAT_MODEL"]
            };
        }
    }

    return { type: 'CONTINUE' };
};
