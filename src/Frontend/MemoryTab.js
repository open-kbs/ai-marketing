import React from 'react';
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
    CircularProgress
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
                                                        onClick={() => saveMemoryItem(item.itemId)}
                                                        color="primary"
                                                    >
                                                        <SaveIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingItem(null);
                                                            setEditValues({});
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
                                                            if (typeof item.value === 'object' && item.value !== null && !Array.isArray(item.value)) {
                                                                setEditValues({ fields: { ...item.value } });
                                                            } else {
                                                                setEditValues({ value: displayValue });
                                                            }
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
                                                {typeof item.value === 'object' && item.value !== null && !Array.isArray(item.value) ? (
                                                    // Object editor
                                                    <Box>
                                                        {Object.entries(editValues.fields || item.value).map(([key, val]) => (
                                                            <Box key={key} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                                <TextField
                                                                    size="small"
                                                                    label="Key"
                                                                    value={key}
                                                                    disabled
                                                                    sx={{ width: '30%' }}
                                                                />
                                                                <TextField
                                                                    size="small"
                                                                    label="Value"
                                                                    value={val}
                                                                    onChange={(e) => {
                                                                        const newFields = { ...(editValues.fields || item.value) };
                                                                        newFields[key] = e.target.value;
                                                                        setEditValues({ ...editValues, fields: newFields });
                                                                    }}
                                                                    sx={{ flex: 1 }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        const newFields = { ...(editValues.fields || item.value) };
                                                                        delete newFields[key];
                                                                        setEditValues({ ...editValues, fields: newFields });
                                                                    }}
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                            <TextField
                                                                size="small"
                                                                placeholder="New key"
                                                                value={editValues.newKey || ''}
                                                                onChange={(e) => setEditValues({ ...editValues, newKey: e.target.value })}
                                                                sx={{ width: '30%' }}
                                                            />
                                                            <TextField
                                                                size="small"
                                                                placeholder="New value"
                                                                value={editValues.newValue || ''}
                                                                onChange={(e) => setEditValues({ ...editValues, newValue: e.target.value })}
                                                                sx={{ flex: 1 }}
                                                            />
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => {
                                                                    if (editValues.newKey) {
                                                                        const newFields = { ...(editValues.fields || item.value) };
                                                                        newFields[editValues.newKey] = editValues.newValue || '';
                                                                        setEditValues({ ...editValues, fields: newFields, newKey: '', newValue: '' });
                                                                    }
                                                                }}
                                                                disabled={!editValues.newKey}
                                                            >
                                                                Add
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    // String editor
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={3}
                                                        value={editValues.value || ''}
                                                        onChange={(e) => setEditValues({ value: e.target.value })}
                                                        variant="outlined"
                                                        size="small"
                                                        label="Value"
                                                    />
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
                        label="Value (enter as text)"
                        value={newItemValue}
                        onChange={(e) => setNewItemValue(e.target.value)}
                        multiline
                        rows={3}
                        helperText="Enter a simple text value. You can edit it as an object later if needed."
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