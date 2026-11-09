// The only file allowed to import from the icon package (see SurfBoard-Icon-Style.md).
// Screens import names from here, so swapping a glyph or the whole family is a one-line change.
// Names kept from the Lucide era on purpose: every screen keeps its JSX as-is.
import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  ArrowsCounterClockwiseIcon,
  ArrowUpIcon,
  BellIcon,
  BookmarkSimpleIcon,
  BugIcon,
  BuildingIcon,
  BuildingsIcon,
  CalendarDotsIcon,
  CalendarIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  ChartBarIcon,
  ChatCenteredDotsIcon,
  ChatCenteredTextIcon,
  ChatCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CopyIcon,
  CropIcon,
  CrownIcon,
  CurrencyInrIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  FileTextIcon,
  FlagIcon,
  FloppyDiskIcon,
  GearIcon,
  GlobeIcon,
  GraduationCapIcon,
  GridFourIcon,
  HourglassIcon,
  HouseIcon,
  InfoIcon,
  LightbulbIcon,
  LinkSimpleIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MapPinIcon,
  MedalIcon,
  MedalMilitaryIcon,
  PencilSimpleIcon,
  PlusIcon,
  PlusSquareIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldWarningIcon,
  SignOutIcon,
  SquaresFourIcon,
  StarIcon,
  TagIcon,
  TargetIcon,
  TicketIcon,
  TrashIcon,
  TrophyIcon,
  UserCheckIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  VideoCameraIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";

export type { IconProps, IconWeight } from "@phosphor-icons/react";
export type AppIcon = (props: IconProps) => React.ReactElement;

// 24px matches the old Lucide default, so icons without a size class keep their footprint.
// Regular is Phosphor's default weight; screens opt into "duotone" for active states only.
function brandIcon(Glyph: PhosphorIcon): AppIcon {
  return function BrandIcon(props) {
    return <Glyph size={24} {...props} />;
  };
}

export const AlertCircle = brandIcon(WarningCircleIcon);
export const AlertTriangle = brandIcon(WarningIcon);
export const ArrowDown = brandIcon(ArrowDownIcon);
export const ArrowLeft = brandIcon(ArrowLeftIcon);
export const ArrowRight = brandIcon(ArrowRightIcon);
export const ArrowUp = brandIcon(ArrowUpIcon);
export const Award = brandIcon(MedalIcon);
export const BarChart2 = brandIcon(ChartBarIcon);
export const Bell = brandIcon(BellIcon);
export const Bookmark = brandIcon(BookmarkSimpleIcon);
export const Bug = brandIcon(BugIcon);
export const Building = brandIcon(BuildingIcon);
export const Building2 = brandIcon(BuildingsIcon);
export const Calendar = brandIcon(CalendarIcon);
export const CalendarDays = brandIcon(CalendarDotsIcon);
export const Check = brandIcon(CheckIcon);
export const CheckCircle = brandIcon(CheckCircleIcon);
export const CheckCircle2 = brandIcon(CheckCircleIcon);
export const ChevronDown = brandIcon(CaretDownIcon);
export const ChevronLeft = brandIcon(CaretLeftIcon);
export const ChevronRight = brandIcon(CaretRightIcon);
export const ChevronUp = brandIcon(CaretUpIcon);
export const Clock = brandIcon(ClockIcon);
export const Copy = brandIcon(CopyIcon);
export const Crop = brandIcon(CropIcon);
export const Crown = brandIcon(CrownIcon);
export const Download = brandIcon(DownloadSimpleIcon);
export const ExternalLink = brandIcon(ArrowSquareOutIcon);
export const Eye = brandIcon(EyeIcon);
export const FileText = brandIcon(FileTextIcon);
export const Flag = brandIcon(FlagIcon);
export const Globe = brandIcon(GlobeIcon);
export const GraduationCap = brandIcon(GraduationCapIcon);
export const Grid = brandIcon(GridFourIcon);
export const Home = brandIcon(HouseIcon);
export const Hourglass = brandIcon(HourglassIcon);
export const IndianRupee = brandIcon(CurrencyInrIcon);
export const Info = brandIcon(InfoIcon);
export const LayoutDashboard = brandIcon(SquaresFourIcon);
export const LayoutGrid = brandIcon(SquaresFourIcon);
export const Lightbulb = brandIcon(LightbulbIcon);
export const Link2 = brandIcon(LinkSimpleIcon);
export const Loader2 = brandIcon(CircleNotchIcon);
export const Lock = brandIcon(LockIcon);
export const LogOut = brandIcon(SignOutIcon);
export const Mail = brandIcon(EnvelopeSimpleIcon);
export const MapPin = brandIcon(MapPinIcon);
export const Medal = brandIcon(MedalMilitaryIcon);
export const MessageCircle = brandIcon(ChatCircleIcon);
export const MessageSquare = brandIcon(ChatCenteredTextIcon);
export const MessageSquareWarning = brandIcon(ChatCenteredDotsIcon);
export const Pencil = brandIcon(PencilSimpleIcon);
export const Plus = brandIcon(PlusIcon);
export const RefreshCcw = brandIcon(ArrowsCounterClockwiseIcon);
export const RefreshCw = brandIcon(ArrowsClockwiseIcon);
export const RotateCcw = brandIcon(ArrowCounterClockwiseIcon);
export const Save = brandIcon(FloppyDiskIcon);
export const Search = brandIcon(MagnifyingGlassIcon);
export const SearchX = brandIcon(MagnifyingGlassMinusIcon);
export const Settings = brandIcon(GearIcon);
export const Share2 = brandIcon(ShareNetworkIcon);
export const Shield = brandIcon(ShieldIcon);
export const ShieldAlert = brandIcon(ShieldWarningIcon);
export const ShieldCheck = brandIcon(ShieldCheckIcon);
export const SquarePlus = brandIcon(PlusSquareIcon);
export const Star = brandIcon(StarIcon);
export const Tag = brandIcon(TagIcon);
export const Target = brandIcon(TargetIcon);
export const Ticket = brandIcon(TicketIcon);
export const Trash2 = brandIcon(TrashIcon);
export const Trophy = brandIcon(TrophyIcon);
export const UploadCloud = brandIcon(CloudArrowUpIcon);
export const User = brandIcon(UserIcon);
export const UserCheck = brandIcon(UserCheckIcon);
export const UserPlus = brandIcon(UserPlusIcon);
export const Users = brandIcon(UsersIcon);
export const Video = brandIcon(VideoCameraIcon);
export const X = brandIcon(XIcon);
export const XCircle = brandIcon(XCircleIcon);
