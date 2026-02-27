import type { IconBaseProps, IconType } from 'react-icons';
import {
  MdAutoFixHigh,
  MdDeleteOutline,
  MdDownload,
  MdLink,
  MdUploadFile,
  MdWarningAmber,
  MdCreateNewFolder,
  MdFolderOpen,
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
export const PairRuleIcon = withDefaultClass(MdLink);
export const PositionRuleIcon = withDefaultClass(MdSwapVert);
export const ConflictIcon = withDefaultClass(MdWarningAmber);
