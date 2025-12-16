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
import ArchiveIcon from '@mui/icons-material/Archive';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BiotechIcon from '@mui/icons-material/Biotech';

// Single source of truth for all commands
// selfClosing: true means <command/>, false means <command>...</command>
export const COMMANDS = {
    getSora2PromptingGuide: { icon: MenuBookIcon, selfClosing: true },
    getWebPublishingGuide: { icon: DescriptionIcon, selfClosing: true },
    createAIImage: { icon: ImageIcon },
    createAIVideo: { icon: VideoLibraryIcon },
    continueVideoPolling: { icon: HourglassEmptyIcon },
    publishWebPage: { icon: LanguageIcon },
    sendMail: { icon: EmailIcon },
    googleSearch: { icon: SearchIcon },
    googleImageSearch: { icon: CollectionsIcon },
    viewImage: { icon: ImageIcon },
    webpageToText: { icon: ArticleIcon },
    setMemory: { icon: SaveIcon },
    deleteItem: { icon: DeleteIcon },
    cleanupMemory: { icon: ClearIcon, selfClosing: true },
    scheduleTask: { icon: ScheduleIcon },
    getScheduledTasks: { icon: ListAltIcon, selfClosing: true },
    deleteScheduledTask: { icon: ClearIcon },
    archiveItems: { icon: ArchiveIcon },
    searchArchive: { icon: ManageSearchIcon },
    deepResearch: { icon: BiotechIcon },
    continueDeepResearchPolling: { icon: HourglassEmptyIcon }
};

// Generate regex patterns from commands
export const COMMAND_PATTERNS = Object.entries(COMMANDS).map(([name, config]) => {
    if (config.selfClosing) {
        return new RegExp(`<${name}\\s*\\/>`);
    }
    return new RegExp(`<${name}>[\\s\\S]*?<\\/${name}>`);
});

// Get icon for a command
export const getCommandIcon = (name) => COMMANDS[name]?.icon;

// Check if command name is valid
export const isValidCommand = (name) => name in COMMANDS;
