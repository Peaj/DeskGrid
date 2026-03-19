import type { IconBaseProps, IconType } from 'react-icons';
import {
  MdAutoFixHigh,
  MdCancel,
  MdCheckCircle,
  MdClose,
  MdExpandLess,
  MdExpandMore,
  MdDeleteOutline,
  MdDownload,
  MdLink,
  MdSwapHoriz,
  MdRemove,
  MdUploadFile,
  MdWarningAmber,
  MdCreateNewFolder,
  MdFolderOpen,
  MdPerson,
  MdSave,
  MdShuffle,
  MdSwapVert,
} from 'react-icons/md';

type IconProps = IconBaseProps;

function withDefaultClass(Icon: IconType) {
  return function MaterialIcon({ className, ...props }: IconProps) {
    return <Icon className={className ?? 'ui-icon'} aria-hidden="true" {...props} />;
  };
}

export const SaveIcon = withDefaultClass(MdSave);
export const LoadIcon = withDefaultClass(MdFolderOpen);
export const ImportIcon = withDefaultClass(MdUploadFile);
export const ExportIcon = withDefaultClass(MdDownload);
export const TrashIcon = withDefaultClass(MdDeleteOutline);
export const NewProjectIcon = withDefaultClass(MdCreateNewFolder);
export const ShuffleIcon = withDefaultClass(MdShuffle);
export const SolveIcon = withDefaultClass(MdAutoFixHigh);
export const StudentPortraitIcon = withDefaultClass(MdPerson);
export const PairRuleIcon = withDefaultClass(MdLink);
export const PositionRuleIcon = withDefaultClass(MdSwapVert);
export const ConflictIcon = withDefaultClass(MdWarningAmber);
export const NextToIcon = withDefaultClass(MdSwapHoriz);
export const NotNextToIcon = withDefaultClass(MdClose);
export const FrontIcon = withDefaultClass(MdExpandMore);
export const BackIcon = withDefaultClass(MdExpandLess);
export const CheckIcon = withDefaultClass(MdCheckCircle);
export const CrossIcon = withDefaultClass(MdCancel);
export const MinusIcon = withDefaultClass(MdRemove);
export const CloseIcon = withDefaultClass(MdClose);
