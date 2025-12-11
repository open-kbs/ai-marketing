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
    Edit as EditIcon,
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


const AgentPanel = ({ openkbs, onClose, initialTab = 0, onTabChange, setSystemAlert, setBlockingLoading }) => {
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPath, setCurrentPath] = useState([]);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, file: null });
    const [renameDialog, setRenameDialog] = useState({ open: false, file: null });
    const [newFileName, setNewFileName] = useState('');
    const [shares, setShares] = useState([]);
    const [shareEmail, setShareEmail] = useState('');
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
        // Close dialog immediately
        setDeleteDialog({ open: false, file: null });

        try {
            setLoading(true);

            // Use openkbs Files API to delete
            await openkbs.Files.deleteRawKBFile(file.name, 'files');

            // Refresh file list
            await listFiles();
            setSystemAlert({
                msg: 'File deleted successfully',
                type: 'success',
                duration: 3000
            });
        } catch (err) {
            console.error('Error deleting file:', err);
            setError('Failed to delete file');
            setSystemAlert({
                msg: 'Failed to delete file',
                type: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    // Rename file
        const renameFile = async () => {
        if (!newFileName.trim() || !renameDialog.file) return;

        // Close dialog immediately
        const oldFileName = renameDialog.file.key;
        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        const newFileName_ = pathPrefix + newFileName;

        setRenameDialog({ open: false, file: null });
        setNewFileName('');

        try {
            setLoading(true);

            // Use the new renameFile method from OpenKBS Files API
            await openkbs.Files.renameFile(oldFileName, newFileName_, 'files');

            // Refresh file list
            await listFiles();
            setSystemAlert({
                msg: 'File renamed successfully',
                type: 'success',
                duration: 3000
            });
        } catch (err) {
            console.error('Error renaming file:', err);
            setError('Failed to rename file');
            setSystemAlert({
                msg: 'Failed to rename file',
                type: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
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
            setSystemAlert({
                msg: 'Failed to load shares',
                type: 'error',
                duration: 5000
            });
            setShares([]);
        } finally {
            setLoading(false);
        }
    };

    // Share with user
    const shareWithUser = async () => {
        if (!shareEmail.trim()) {
            setSystemAlert({
                msg: 'Please enter an email address',
                type: 'error',
                duration: 3000
            });
            return;
        }

        try {
            setLoading(true);

            // Pass email directly as targetUserId - SDK will handle conversion if needed
            await openkbs.KBAPI.shareKBWith(shareEmail);

            setSystemAlert({
                msg: `Successfully shared with ${shareEmail}`,
                type: 'success',
                duration: 3000
            });
            setShareEmail('');

            // Reload shares
            await loadShares();
        } catch (err) {
            console.error('Error sharing:', err);
            setSystemAlert({
                msg: err.message || 'Failed to share with user',
                type: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    // Remove share
    const removeShare = async (email) => {
        try {
            setLoading(true);

            // Pass email directly - SDK will handle conversion if needed
            await openkbs.KBAPI.unshareKBWith(email);

            setSystemAlert({
                msg: `Removed share with ${email}`,
                type: 'success',
                duration: 3000
            });

            await loadShares();
        } catch (err) {
            console.error('Error removing share:', err);
            setSystemAlert({
                msg: 'Failed to remove share',
                type: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    // Load memory items
    const loadMemoryItems = async (reset = false) => {
        try {
            setLoading(true);
            setBlockingLoading(true);

            const result = await openkbs.fetchItems({
                itemType: 'memory',
                limit: memoryLimit
            });

            if (result && result.items) {
                const items = result.items.map(({ item, meta }) => {
                    let actualValue = item.body;

                    // If body has a 'value' property, extract it (this is our wrapped structure)
                    if (actualValue && typeof actualValue === 'object' && 'value' in actualValue) {
                        actualValue = actualValue.value;
                    }

                    return {
                        itemId: meta.itemId,
                        value: actualValue
                    };
                });

                if (reset) {
                    setMemoryItems(items);
                } else {
                    setMemoryItems(prev => [...prev, ...items]);
                }

                setMemoryHasMore(items.length === memoryLimit);
            }
        } catch (err) {
            console.error('Error loading memory items:', err);
            setSystemAlert({
                msg: 'Failed to load memory items',
                type: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
            setBlockingLoading(false);
        }
    };

    // Save memory item
    const saveMemoryItem = async (itemId) => {
        try {
            setLoading(true);

            let value;

            // If we have fields (object was edited), use those
            if (editValues.fields) {
                value = editValues.fields;
            } else {
                // String value
                value = editValues.value;
                // Try to parse as JSON if it looks like JSON
                if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Keep as string if not valid JSON
                    }
                }
            }

            // Wrap in the standard structure
            const body = {
                value: value,
                updatedAt: new Date().toISOString()
            };

            await openkbs.updateItem({
                itemType: 'memory',
                itemId: itemId,
                body: body
            });

            // Reload to get fresh data from backend
            await loadMemoryItems(true);

            setEditingItem(null);
            setEditValues({});

            // Show success message
            setSystemAlert({
                msg: `Successfully saved ${itemId}`,
                type: 'success',
                duration: 3000
            });
        } catch (err) {
            console.error('Error saving memory item:', err);
            setSystemAlert({
                msg: 'Failed to save memory item. Please try again.',
                type: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete memory item
    const deleteMemoryItem = async (itemId) => {
        // Optimistically remove from local state immediately
        setMemoryItems(items => items.filter(item => item.itemId !== itemId));

        try {
            await openkbs.deleteItem(itemId);

            // Show success message
            setSystemAlert({
                msg: `Successfully deleted ${itemId}`,
                type: 'success',
                duration: 3000
            });
        } catch (err) {
            console.error('Error deleting memory item:', err);

            // Restore the item on error by reloading
            await loadMemoryItems(true);

            setSystemAlert({
                msg: 'Failed to delete memory item. Please try again.',
                type: 'error',
                duration: 5000
            });
        }
    };

    // Create new memory item
    const createMemoryItem = async () => {
        if (!newItemKey.trim()) {
            setSystemAlert({
                msg: 'Please enter a key for the memory item',
                type: 'error',
                duration: 3000
            });
            return;
        }

        // Close dialog immediately
        const keyToUse = newItemKey;
        const valueToUse = newItemValue;
        setNewItemDialog(false);
        setNewItemKey('');
        setNewItemValue('');

        try {
            setLoading(true);

            // Keep value as string
            const value = valueToUse.trim() || '';

            // Always ensure memory_ prefix
            const itemId = keyToUse.startsWith('memory_') ? keyToUse : `memory_${keyToUse}`;

            // Wrap in the same structure as setMemory uses
            const body = {
                value: value,
                updatedAt: new Date().toISOString()
            };

            await openkbs.updateItem({
                itemType: 'memory',
                itemId: itemId,
                body: body
            });

            // Reload items
            await loadMemoryItems(true);

            // Show success message
            setSystemAlert({
                msg: `Successfully created ${itemId}`,
                type: 'success',
                duration: 3000
            });
        } catch (err) {
            console.error('Error creating memory item:', err);
            setSystemAlert({
                msg: 'Failed to create memory item. Please try again.',
                type: 'error',
                duration: 5000
            });
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
            loadMemoryItems(true);
        } else if (currentTab === 2) {
            loadShares();
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
                            icon={<StorageIcon />}
                            label="Memory"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<AccessIcon />}
                            label="Access"
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
                                                <Box>
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRenameDialog({ open: true, file: item });
                                                            setNewFileName(item.name);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteDialog({ open: true, file: item });
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
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

                    {/* Memory Tab */}
                    {currentTab === 1 && (
                        <MemoryTab
                            state={{
                                memoryItems,
                                loading,
                                editingItem,
                                editValues,
                                newItemDialog,
                                newItemKey,
                                newItemValue,
                                memoryHasMore
                            }}
                            actions={{
                                setEditingItem,
                                setEditValues,
                                saveMemoryItem,
                                deleteMemoryItem,
                                setNewItemDialog,
                                setNewItemKey,
                                setNewItemValue,
                                createMemoryItem,
                                loadMoreItems: () => {
                                    setMemoryLimit(prev => prev + 20);
                                    loadMemoryItems();
                                },
                                formatValue
                            }}
                        />
                    )}

                    {/* Access Tab */}
                    {currentTab === 2 && (
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
                                                onClick={() => removeShare(share.email)}
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

                {/* Rename Dialog */}
                <Dialog open={renameDialog.open} onClose={() => { setRenameDialog({ open: false, file: null }); setNewFileName(''); }}>
                    <DialogTitle>Rename File</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="New filename"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            sx={{ mt: 1 }}
                            autoFocus
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setRenameDialog({ open: false, file: null }); setNewFileName(''); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={renameFile}
                            variant="contained"
                            disabled={!newFileName.trim()}
                        >
                            Rename
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default AgentPanel;