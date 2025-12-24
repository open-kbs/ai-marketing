import React, { useState, useEffect } from 'react';
import {
    Box,
    List,
    ListItem,
    Typography,
    IconButton,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon
} from '@mui/icons-material';

const MemoryTab = ({ state, actions }) => {
    const {
        memoryItems,
        loading,
        editingItem,
        editValues,
        newItemDialog,
        newItemKey,
        newItemValue,
        memoryHasMore
    } = state;

    const {
        setEditingItem,
        setEditValues,
        saveMemoryItem,
        deleteMemoryItem,
        setNewItemDialog,
        setNewItemKey,
        setNewItemValue,
        createMemoryItem,
        loadMoreItems,
        formatValue
    } = actions;

    const [jsonError, setJsonError] = useState(null);

    // Validate JSON on change
    const handleJsonChange = (value) => {
        setEditValues({ jsonText: value });
        try {
            JSON.parse(value);
            setJsonError(null);
        } catch (e) {
            setJsonError(e.message);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Memory Items</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setNewItemDialog(true)}
                    size="small"
                >
                    Add Item
                </Button>
            </Box>

            {loading && memoryItems.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <List>
                        {memoryItems.map((item) => {
                            const isEditing = editingItem === item.itemId;
                            const displayValue = formatValue(item.value);

                            return (
                                <ListItem
                                    key={item.itemId}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        borderBottom: '1px solid #e0e0e0',
                                        py: 1
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold' }}>
                                            {item.itemId}
                                        </Typography>
                                        <Box>
                                            {isEditing ? (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setJsonError(null);
                                                            saveMemoryItem(item.itemId);
                                                        }}
                                                        color="primary"
                                                        disabled={!!jsonError}
                                                    >
                                                        <SaveIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingItem(null);
                                                            setEditValues({});
                                                            setJsonError(null);
                                                        }}
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingItem(item.itemId);
                                                            // Store as formatted JSON string
                                                            const jsonStr = typeof item.value === 'string'
                                                                ? item.value
                                                                : JSON.stringify(item.value, null, 2);
                                                            setEditValues({ jsonText: jsonStr });
                                                            setJsonError(null);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => deleteMemoryItem(item.itemId)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        {isEditing ? (
                                            <Box>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    minRows={4}
                                                    maxRows={20}
                                                    value={editValues.jsonText || ''}
                                                    onChange={(e) => handleJsonChange(e.target.value)}
                                                    variant="outlined"
                                                    size="small"
                                                    error={!!jsonError}
                                                    sx={{
                                                        '& .MuiInputBase-input': {
                                                            fontFamily: 'monospace',
                                                            fontSize: '13px'
                                                        }
                                                    }}
                                                />
                                                {jsonError && (
                                                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                                                        Invalid JSON: {jsonError}
                                                    </Alert>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    backgroundColor: '#f5f5f5',
                                                    p: 1,
                                                    borderRadius: 1,
                                                    fontSize: '12px',
                                                    maxHeight: '150px',
                                                    overflow: 'auto',
                                                    whiteSpace: 'pre-wrap'
                                                }}
                                            >
                                                {displayValue}
                                            </Typography>
                                        )}
                                    </Box>
                                </ListItem>
                            );
                        })}
                    </List>

                    {memoryItems.length === 0 && (
                        <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                            No memory items yet
                        </Typography>
                    )}

                    {memoryHasMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button onClick={loadMoreItems} disabled={loading}>
                                Load More
                            </Button>
                        </Box>
                    )}
                </>
            )}

            {/* New Item Dialog */}
            <Dialog open={newItemDialog} onClose={() => setNewItemDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Memory Item</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Key (without memory_ prefix)"
                        value={newItemKey}
                        onChange={(e) => setNewItemKey(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Value (JSON or text)"
                        value={newItemValue}
                        onChange={(e) => setNewItemValue(e.target.value)}
                        multiline
                        rows={4}
                        helperText="Enter JSON object or simple text value"
                        sx={{
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '13px'
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setNewItemDialog(false);
                        setNewItemKey('');
                        setNewItemValue('');
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={createMemoryItem} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MemoryTab;
