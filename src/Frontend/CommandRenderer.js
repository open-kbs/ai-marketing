import React, { useState } from 'react';
import { Box, Tooltip, Typography, Zoom, Chip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LanguageIcon from '@mui/icons-material/Language';
import EmailIcon from '@mui/icons-material/Email';
import SearchIcon from '@mui/icons-material/Search';
import CollectionsIcon from '@mui/icons-material/Collections';
import ArticleIcon from '@mui/icons-material/Article';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ClearIcon from '@mui/icons-material/Clear';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import BoltIcon from '@mui/icons-material/Bolt';

// Icon mappings for different command types
const commandIcons = {
    setMemory: SaveIcon,
    deleteItem: DeleteIcon,
    createAIImage: ImageIcon,
    createAIVideo: VideoLibraryIcon,
    continueVideoPolling: HourglassEmptyIcon,
    publishWebPage: LanguageIcon,
    sendMail: EmailIcon,
    googleSearch: SearchIcon,
    googleImageSearch: CollectionsIcon,
    webpageToText: ArticleIcon,
    scheduleTask: ScheduleIcon,
    getScheduledTasks: ListAltIcon,
    deleteScheduledTask: ClearIcon,
    getSora2PromptingGuide: MenuBookIcon,
    getWebPublishingGuide: DescriptionIcon
};

// List of valid command names
const validCommands = [
    'getSora2PromptingGuide',
    'getWebPublishingGuide',
    'createAIImage',
    'createAIVideo',
    'continueVideoPolling',
    'publishWebPage',
    'sendMail',
    'googleSearch',
    'googleImageSearch',
    'webpageToText',
    'setMemory',
    'deleteItem',
    'scheduleTask',
    'getScheduledTasks',
    'deleteScheduledTask'
];

// Parse commands from content
const parseCommands = (content) => {
    if (!content) return [];

    const commands = [];
    const regex = /<(\w+)(?:>([\s\S]*?)<\/\1>|\s*\/>)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const commandName = match[1];

        // Only process if it's a valid command
        if (!validCommands.includes(commandName)) {
            continue;
        }

        const commandContent = match[2] || '';

        let parsedData = null;
        if (commandContent) {
            try {
                parsedData = JSON.parse(commandContent.trim());
            } catch (e) {
                parsedData = commandContent.trim();
            }
        }

        commands.push({
            name: commandName,
            data: parsedData,
            fullMatch: match[0]
        });
    }

    return commands;
};

// Single command circle component
const CommandCircle = ({ command, index, response }) => {
    const [hovering, setHovering] = useState(false);
    const IconComponent = commandIcons[command.name] || BoltIcon;

    // Determine if command has completed (has response)
    const hasResponse = !!response;
    const isSuccess = response && !response.error;
    const isError = response && response.error;

    // Format tooltip content to show both request and response
    const getTooltipContent = () => {
        return (
            <Box sx={{ p: 1, maxWidth: 400 }}>
                {/* Command Name */}
                <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    color: '#4CAF50',
                    display: 'block',
                    mb: 0.5
                }}>
                    {command.name}
                </Typography>

                {/* Request Parameters */}
                {command.data && (
                    <>
                        <Typography variant="caption" sx={{
                            color: '#90CAF9',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}>
                            REQUEST:
                        </Typography>
                        <Box sx={{
                            display: 'block',
                            fontSize: '10px',
                            color: '#fff',
                            ml: 1,
                            mb: 0.5,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {typeof command.data === 'object'
                                ? JSON.stringify(command.data, null, 2)
                                : String(command.data)
                            }
                        </Box>
                    </>
                )}

                {/* Response */}
                {response && (
                    <>
                        <Typography variant="caption" sx={{
                            color: response.error ? '#FF6B6B' : '#81C784',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}>
                            RESPONSE:
                        </Typography>
                        <Box sx={{
                            display: 'block',
                            fontSize: '10px',
                            color: '#fff',
                            ml: 1,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {response.error
                                ? `Error: ${response.error}`
                                : JSON.stringify(response, null, 2)
                            }
                        </Box>
                    </>
                )}

                {/* Loading state */}
                {!response && (
                    <Typography variant="caption" sx={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#FFA726',
                        fontStyle: 'italic',
                        mt: 0.5
                    }}>
                        Waiting for response...
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Tooltip
            title={getTooltipContent()}
            placement="top"
            arrow
            TransitionComponent={Zoom}
            sx={{
                '& .MuiTooltip-tooltip': {
                    backgroundColor: 'rgba(0, 0, 0, 0.87)',
                    maxWidth: 300
                }
            }}
        >
            <Box
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: hovering
                        ? (isError ? 'rgba(244, 67, 54, 0.15)' : isSuccess ? 'rgba(76, 175, 80, 0.15)' : 'rgba(158, 158, 158, 0.15)')
                        : (isError ? 'rgba(244, 67, 54, 0.08)' : isSuccess ? 'rgba(76, 175, 80, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
                    border: '2px solid',
                    borderColor: hovering
                        ? (isError ? '#f44336' : isSuccess ? '#4CAF50' : '#9e9e9e')
                        : (isError ? 'rgba(244, 67, 54, 0.3)' : isSuccess ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.12)'),
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hovering ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: hovering ? '0 4px 20px rgba(25, 118, 210, 0.25)' : 'none',
                    animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`,
                    '@keyframes fadeIn': {
                        '0%': {
                            opacity: 0,
                            transform: 'scale(0.8)'
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'scale(1)'
                        }
                    }
                }}
            >
                <IconComponent
                    sx={{
                        fontSize: 18,
                        color: hovering
                            ? (isError ? '#f44336' : isSuccess ? '#4CAF50' : '#9e9e9e')
                            : (isError ? 'rgba(244, 67, 54, 0.7)' : isSuccess ? 'rgba(76, 175, 80, 0.7)' : 'rgba(0, 0, 0, 0.54)')
                    }}
                />
            </Box>
        </Tooltip>
    );
};

// Main component
const CommandRenderer = ({ content, responseData }) => {
    const commands = parseCommands(content);

    if (commands.length === 0) return null;

    // For single command, pass the response directly
    // For multiple commands, we'd need more complex logic
    const getResponseForCommand = (cmd, index) => {
        if (commands.length === 1) {
            return responseData;
        }
        // For multiple commands, response mapping would go here
        return responseData;
    };

    // Show compact view for commands
    return (
        <Box
            sx={{
                display: 'inline-flex',
                gap: 0.5,
                flexWrap: 'wrap',
                alignItems: 'center',
                my: 1
            }}
        >
            {commands.map((cmd, index) => (
                <CommandCircle
                    key={index}
                    command={cmd}
                    index={index}
                    response={getResponseForCommand(cmd, index)}
                />
            ))}
            {responseData && responseData.type === 'VIDEO_PENDING' && responseData.data?.message && (
                <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    ml: 1,
                    padding: '4px 12px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    color: '#856404',
                    fontSize: '13px',
                    fontWeight: 500
                }}>
                    ⏳ Please wait and DO NOT refresh your browser! Video is generating...
                </Box>
            )}
        </Box>
    );
};

export default CommandRenderer;