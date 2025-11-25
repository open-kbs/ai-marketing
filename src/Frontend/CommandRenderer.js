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
const CommandCircle = ({ command, index }) => {
    const [hovering, setHovering] = useState(false);
    const IconComponent = commandIcons[command.name] || BoltIcon;

    // Format tooltip content based on command data
    const getTooltipContent = () => {
        if (!command.data) return command.name;

        if (typeof command.data === 'object') {
            // Special formatting for setMemory
            if (command.name === 'setMemory' && command.data.itemId) {
                return (
                    <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff' }}>
                            {command.data.itemId}
                        </Typography>
                        {command.data.value && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '10px' }}>
                                {typeof command.data.value === 'object'
                                    ? Object.keys(command.data.value).join(', ')
                                    : String(command.data.value).substring(0, 50) + '...'
                                }
                            </Typography>
                        )}
                    </Box>
                );
            }

            // Generic object display
            return (
                <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#fff' }}>
                        {command.name}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '10px' }}>
                        {JSON.stringify(command.data, null, 2).substring(0, 200)}
                    </Typography>
                </Box>
            );
        }

        return command.name;
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
                    backgroundColor: hovering ? 'rgba(25, 118, 210, 0.15)' : 'rgba(0, 0, 0, 0.04)',
                    border: '2px solid',
                    borderColor: hovering ? '#1976d2' : 'rgba(0, 0, 0, 0.12)',
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
                        color: hovering ? '#1976d2' : 'rgba(0, 0, 0, 0.54)'
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
                />
            ))}
            {responseData && responseData.error && (
                <Chip
                    label="Error"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ ml: 1, height: 24 }}
                />
            )}
            {responseData && responseData.type === 'MEMORY_UPDATED' && (
                <Chip
                    label="✓ Saved"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ ml: 1, height: 24 }}
                />
            )}
        </Box>
    );
};

export default CommandRenderer;