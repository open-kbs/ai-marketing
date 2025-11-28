import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Typography,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Breadcrumbs,
    Link,
    TextField,
    Chip
} from '@mui/material';
import {
    Folder as FolderIcon,
    InsertDriveFile as FileIcon,
    Delete as DeleteIcon,
    VpnKey as AccessIcon,
    FolderOpen as FilesIcon,
    Close as CloseIcon,
    Home as HomeIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    Code as CodeIcon,
    PictureAsPdf as PdfIcon,
    Description as DocumentIcon,
    AudioFile as AudioIcon,
    Archive as ZipIcon,
    Html as HtmlIcon,
    Storage as StorageIcon
} from '@mui/icons-material';
import MemoryTab from './MemoryTab';

const KB_API_URL = 'https://kb.openkbs.com/';
const isMobile = window.innerWidth < 960;

const getFileIcon = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return <ImageIcon sx={{ color: '#4CAF50' }} />;
    if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'].includes(ext)) return <VideoIcon sx={{ color: '#FF5722' }} />;
    if (['html', 'htm', 'xml', 'xhtml'].includes(ext)) return <HtmlIcon sx={{ color: '#FF9800' }} />;
    if (['js', 'json', 'css', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext)) return <CodeIcon sx={{ color: '#2196F3' }} />;
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#F44336' }} />;
    if (['doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) return <DocumentIcon sx={{ color: '#673AB7' }} />;
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'wma', 'm4a'].includes(ext)) return <AudioIcon sx={{ color: '#009688' }} />;
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return <ZipIcon sx={{ color: '#795548' }} />;
    return <FileIcon sx={{ color: '#757575' }} />;
};


const AgentPanel = ({ openkbs, onClose, initialTab = 0, onTabChange, setSystemAlert }) => {
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPath, setCurrentPath] = useState([]);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, file: null });
    const [shares, setShares] = useState([]);
    const [shareEmail, setShareEmail] = useState('');
    const [sharingError, setSharingError] = useState('');
    const [sharingSuccess, setSharingSuccess] = useState('');
    // Memory CRUD state
    const [memoryItems, setMemoryItems] = useState([]);
    const [memoryLimit, setMemoryLimit] = useState(20);
    const [memoryHasMore, setMemoryHasMore] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [newItemDialog, setNewItemDialog] = useState(false);
    const [newItemKey, setNewItemKey] = useState('');
    const [newItemValue, setNewItemValue] = useState('');

    // List files in current path
    const listFiles = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('kbJWT');
            const response = await fetch(KB_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    action: 'listFiles',
                    namespace: 'files'
                })
            });

            const data = await response.json();
            if (Array.isArray(data)) {
                const items = [];
                const pathPrefix = currentPath.length > 0
                    ? `files/${openkbs.kbId}/${currentPath.join('/')}/`
                    : `files/${openkbs.kbId}/`;

                // Process files and folders
                const folders = new Set();
                const filesList = [];

                data.forEach(file => {
                    if (file.Key && file.Key.startsWith(pathPrefix)) {
                        const relativePath = file.Key.substring(pathPrefix.length);
                        const parts = relativePath.split('/');

                        if (parts.length === 1 && parts[0]) {
                            // Direct file in current path
                            filesList.push({
                                name: parts[0],
                                key: file.Key,
                                size: file.Size,
                                lastModified: file.LastModified
                            });
                        } else if (parts.length > 1 && parts[0]) {
                            // Subfolder
                            folders.add(parts[0]);
                        }
                    }
                });

                // Add folders first
                folders.forEach(folder => {
                    items.push({
                        name: folder,
                        isFolder: true
                    });
                });

                // Add files
                items.push(...filesList);

                setFiles(items);
            }
        } catch (err) {
            console.error('Error listing files:', err);
            setError('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    // Delete file
    const deleteFile = async (file) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('kbJWT');

            await fetch(KB_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    action: 'deleteFile',
                    key: file.key,
                    namespace: 'files'
                })
            });

            // Refresh file list
            await listFiles();
        } catch (err) {
            console.error('Error deleting file:', err);
            setError('Failed to delete file');
        } finally {
            setLoading(false);
            setDeleteDialog({ open: false, file: null });
        }
    };

    // Open file in new tab
    const openFile = (file) => {
        const fileUrl = `https://web.file.vpc1.us/${file.key}`;
        window.open(fileUrl, '_blank');
    };

    // Navigate to folder
    const navigateToFolder = (folderName) => {
        setCurrentPath([...currentPath, folderName]);
    };

    // Navigate using breadcrumbs
    const navigateToPath = (index) => {
        if (index === -1) {
            setCurrentPath([]);
        } else {
            setCurrentPath(currentPath.slice(0, index + 1));
        }
    };

    // Load current shares
    const loadShares = async () => {
        try {
            setLoading(true);
            setSharingError('');

            const result = await openkbs.KBAPI.getKBShares();
            if (result && result.sharedWith) {
                // Convert email array to objects for easier handling
                const sharesList = Array.isArray(result.sharedWith)
                    ? result.sharedWith.map(email => ({ email }))
                    : [];
                setShares(sharesList);
            } else {
                setShares([]);
            }
        } catch (err) {
            console.error('Error loading shares:', err);
            setSharingError('Failed to load shares');
            setShares([]);
        } finally {
            setLoading(false);
        }
    };

    // Share with user
    const shareWithUser = async () => {
        if (!shareEmail.trim()) {
            setSharingError('Please enter an email address');
            return;
        }

        try {
            setLoading(true);
            setSharingError('');
            setSharingSuccess('');

            // Pass email directly as targetUserId - SDK will handle conversion if needed
            await openkbs.KBAPI.shareKBWith(shareEmail);

            setSharingSuccess(`Successfully shared with ${shareEmail}`);
            setShareEmail('');

            // Reload shares
            await loadShares();
        } catch (err) {
            console.error('Error sharing:', err);
            setSharingError(err.message || 'Failed to share with user');
        } finally {
            setLoading(false);
        }
    };

    // Remove share
    const removeShare = async (email) => {
        try {
            setLoading(true);
            setSharingError('');

            // Pass email directly - SDK will handle conversion if needed
            await openkbs.KBAPI.unshareKBWith(email);
            await loadShares();
        } catch (err) {
            console.error('Error removing share:', err);
            setSharingError('Failed to remove share');
        } finally {
            setLoading(false);
        }
    };

    // Load memory items
    const loadMemoryItems = async (reset = false) => {
        try {
            setLoading(true);

            const result = await openkbs.fetchItems({
                itemType: 'memory',
                limit: memoryLimit,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            if (result && result.items) {
                const items = result.items.map(({ item, meta }) => ({
                    itemId: meta.itemId,
                    value: item.body
                }));

                if (reset) {
                    setMemoryItems(items);
                } else {
                    setMemoryItems(prev => [...prev, ...items]);
                }

                setMemoryHasMore(items.length === memoryLimit);
            }
        } catch (err) {
            console.error('Error loading memory items:', err);
            if (setSystemAlert) {
                setSystemAlert({
                    severity: 'error',
                    message: 'Failed to load memory items'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Save memory item
    const saveMemoryItem = async (itemId) => {
        try {
            setLoading(true);

            let value = editValues.value;
            // Try to parse as JSON if it looks like JSON
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }

            // Only pass the value, not any metadata fields
            await openkbs.updateItem({
                itemType: 'memory',
                itemId: itemId,
                body: value
            });

            // Reload to get fresh data from backend
            await loadMemoryItems(true);

            setEditingItem(null);
            setEditValues({});

            // Show success message
            if (setSystemAlert) {
                setSystemAlert({
                    msg: `Successfully saved ${itemId}`,
                    type: 'success',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Error saving memory item:', err);
            if (setSystemAlert) {
                setSystemAlert({
                    severity: 'error',
                    message: 'Failed to save memory item. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Delete memory item
    const deleteMemoryItem = async (itemId) => {
        try {
            setLoading(true);

            await openkbs.deleteItem(itemId);

            // Remove from local state
            setMemoryItems(items => items.filter(item => item.itemId !== itemId));

            // Show success message
            if (setSystemAlert) {
                setSystemAlert({
                    msg: `Successfully deleted ${itemId}`,
                    type: 'success',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Error deleting memory item:', err);
            if (setSystemAlert) {
                setSystemAlert({
                    severity: 'error',
                    message: 'Failed to delete memory item. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Create new memory item
    const createMemoryItem = async () => {
        try {
            if (!newItemKey.trim()) {
                if (setSystemAlert) {
                    setSystemAlert({
                        severity: 'error',
                        message: 'Please enter a key for the memory item'
                    });
                }
                return;
            }

            setLoading(true);

            let value = newItemValue;
            // Try to parse as JSON if it looks like JSON
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }

            // Always ensure memory_ prefix
            const itemId = newItemKey.startsWith('memory_') ? newItemKey : `memory_${newItemKey}`;
            await openkbs.updateItem({
                itemType: 'memory',
                itemId: itemId,
                body: value
            });

            // Reload items
            await loadMemoryItems(true);

            setNewItemDialog(false);
            setNewItemKey('');
            setNewItemValue('');

            // Show success message
            if (setSystemAlert) {
                setSystemAlert({
                    msg: `Successfully created ${itemId}`,
                    type: 'success',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Error creating memory item:', err);
            if (setSystemAlert) {
                setSystemAlert({
                    severity: 'error',
                    message: 'Failed to create memory item. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };


    // Format value for display
    const formatValue = (value) => {
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    useEffect(() => {
        if (currentTab === 0) {
            listFiles();
        } else if (currentTab === 1) {
            loadShares();
        } else if (currentTab === 2) {
            loadMemoryItems(true);
        }
    }, [currentTab, currentPath]);

    return (
        <Box
            onClick={onClose}
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1300,
                display: 'flex',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: isMobile ? 'stretch' : 'center'
            }}
        >
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    width: isMobile ? '100vw' : '700px',
                    height: isMobile ? '100vh' : '80vh',
                    backgroundColor: 'white',
                    borderRadius: isMobile ? 0 : '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: '1px solid #e0e0e0'
                }}>
                    <Typography variant="h6">Manage</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={(e, v) => {
                        setCurrentTab(v);
                        if (onTabChange) onTabChange(v);
                    }}>
                        <Tab
                            icon={<FilesIcon />}
                            label="Files"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<AccessIcon />}
                            label="Access"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<StorageIcon />}
                            label="Memory"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {currentTab === 0 && (
                        <>
                            {/* Breadcrumbs */}
                            <Breadcrumbs sx={{ mb: 2 }}>
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => navigateToPath(-1)}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                >
                                    <HomeIcon fontSize="small" />
                                    Files
                                </Link>
                                {currentPath.map((folder, index) => (
                                    <Link
                                        key={index}
                                        component="button"
                                        variant="body2"
                                        onClick={() => navigateToPath(index)}
                                    >
                                        {folder}
                                    </Link>
                                ))}
                            </Breadcrumbs>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                            )}

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <List>
                                    {files.map((item, index) => (
                                        <ListItem
                                            key={index}
                                            button
                                            onClick={() => {
                                                if (item.isFolder) {
                                                    navigateToFolder(item.name);
                                                } else {
                                                    openFile(item);
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                {item.isFolder ? <FolderIcon sx={{ color: '#FFA726' }} /> : getFileIcon(item.name)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={!item.isFolder && item.size ?
                                                    `${(item.size / 1024).toFixed(1)} KB` : null
                                                }
                                            />
                                            {!item.isFolder && (
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteDialog({ open: true, file: item });
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            )}
                                        </ListItem>
                                    ))}
                                    {files.length === 0 && (
                                        <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                            No files in this folder
                                        </Typography>
                                    )}
                                </List>
                            )}
                        </>
                    )}

                    {/* Access Tab */}
                    {currentTab === 1 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Share Access
                            </Typography>

                            {/* Share form */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Email address"
                                    variant="outlined"
                                    size="small"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    placeholder="user@example.com"
                                />
                                <Button
                                    variant="contained"
                                    onClick={shareWithUser}
                                    disabled={loading || !shareEmail.trim()}
                                >
                                    Share
                                </Button>
                            </Box>

                            {/* Messages */}
                            {sharingError && (
                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSharingError('')}>
                                    {sharingError}
                                </Alert>
                            )}
                            {sharingSuccess && (
                                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSharingSuccess('')}>
                                    {sharingSuccess}
                                </Alert>
                            )}

                            {/* Current shares */}
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Current Shares
                            </Typography>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <List>
                                    {shares.map((share, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={share.email}
                                                secondary="Full access"
                                            />
                                            <IconButton
                                                edge="end"
                                                onClick={() => {
                                                    console.log('Removing share:', share);
                                                    removeShare(share.email);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                    {shares.length === 0 && (
                                        <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                            Not shared with anyone yet
                                        </Typography>
                                    )}
                                </List>
                            )}
                        </Box>
                    )}

                    {/* Memory Tab */}
                    {currentTab === 2 && (
                        <MemoryTab
                            memoryItems={memoryItems}
                            loading={loading}
                            editingItem={editingItem}
                            setEditingItem={setEditingItem}
                            editValues={editValues}
                            setEditValues={setEditValues}
                            saveMemoryItem={saveMemoryItem}
                            deleteMemoryItem={deleteMemoryItem}
                            newItemDialog={newItemDialog}
                            setNewItemDialog={setNewItemDialog}
                            newItemKey={newItemKey}
                            setNewItemKey={setNewItemKey}
                            newItemValue={newItemValue}
                            setNewItemValue={setNewItemValue}
                            createMemoryItem={createMemoryItem}
                            loadMoreItems={() => {
                                setMemoryLimit(prev => prev + 20);
                                loadMemoryItems();
                            }}
                            memoryHasMore={memoryHasMore}
                            formatValue={formatValue}
                        />
                    )}
                </Box>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, file: null })}>
                    <DialogTitle>Delete File</DialogTitle>
                    <DialogContent>
                        Are you sure you want to delete "{deleteDialog.file?.name}"?
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog({ open: false, file: null })}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => deleteFile(deleteDialog.file)}
                            color="error"
                            variant="contained"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default AgentPanel;