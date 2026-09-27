import { PageTitle } from "@/components/side-nav";
import { ProjectEditor } from "./project-editor";

export default function NewProjectPage() {
  return (
    <>
      <PageTitle>プロジェクトを作成</PageTitle>
      <p className="mb-6 text-sm text-stone-500">
        作成 → 審査に提出（審査中は編集できません）→ 審査通過 → 公開ボタンを押して募集開始、の流れです。
      </p>
      <ProjectEditor />
    </>
  );
}
