import { useState } from "react";
import { CloudFile } from "../../types/file";
import { CloudenceFolder } from "../../lib/api/folders";
import BulkFileActionBar from "./BulkFileActionBar";
import BulkMoveModal from "./BulkMoveModal";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  files: CloudFile[];
  canMove: boolean;
  folders: CloudenceFolder[];
  currentFolderId: string | null;
  onCancel: () => void;
  onDelete: (files: CloudFile[]) => void;
  onMove: (files: CloudFile[], folderId: string | null) => void;
};

export default function BulkFileSelectionActions({
  files,
  canMove,
  folders,
  currentFolderId,
  onCancel,
  onDelete,
  onMove,
}: Props) {
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [moveVisible, setMoveVisible] = useState(false);
  const count = files.length;

  return (
    <>
      <BulkFileActionBar
        count={count}
        canMove={canMove}
        onMove={() => setMoveVisible(true)}
        onDelete={() => setDeleteVisible(true)}
        onCancel={onCancel}
      />
      <BulkMoveModal
        visible={moveVisible}
        count={count}
        folders={folders}
        currentFolderId={currentFolderId}
        onClose={() => setMoveVisible(false)}
        onSelect={(folderId) => {
          setMoveVisible(false);
          onMove(files, folderId);
        }}
      />
      <ConfirmDialog
        visible={deleteVisible}
        title={`Delete ${count} ${count === 1 ? "file" : "files"}?`}
        message="The selected files will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete permanently"
        destructive
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => {
          setDeleteVisible(false);
          onDelete(files);
        }}
      />
    </>
  );
}
