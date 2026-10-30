/** Danh sách tác vụ và export hiển thị trên giao diện. Impl nằm ở `tasks/pipeline.ts`. */
export interface TaskDef {
  kind: string;
  label: string;
  danger?: boolean;
  confirmText?: string;
  forceRequired?: boolean;
}

export interface ExportDef {
  id: string;
  label: string;
  description: string;
  /** Task chạy trước export (phải không cần force). */
  dependsOn: string[];
}

export const TASKS: TaskDef[] = [
  { kind: "build", label: "Build" },
  {
    kind: "build-recreate",
    label: "Build + Recreate",
    danger: true,
    confirmText: "Delete database/master.db and rebuild from schema/*.sql? All current data will be lost.",
    forceRequired: true
  },
  { kind: "split", label: "Split" },
  { kind: "verify-split", label: "Verify split" },
  { kind: "validate-sqljs", label: "Validate sql.js" }
];

export const EXPORTS: ExportDef[] = [
  {
    id: "app-db",
    label: "Stage to App/public/db",
    description: "Split rồi copy catalog/*.db, runtime-template.db và manifest.json sang App/public/db; xuất bảng language sang App/public/i18n nếu có.",
    dependsOn: ["split"]
  }
];
