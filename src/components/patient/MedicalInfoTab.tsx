import type { Patient } from '../../types';
import { BilingualText } from '../BilingualText';
import { AllergyAlert } from '../AllergyAlert';
import { bloodTypeLabel, genderLabel } from '../../data/options';
import { formatAge, formatDate, formatDateTime } from '../../utils/date';

interface MedicalInfoTabProps {
  patient: Patient;
  onEdit: () => void;
}

interface DefinitionItemProps {
  english: string;
  japanese: string;
  description: string;
}

function DefinitionItem({ english, japanese, description }: DefinitionItemProps) {
  return (
    <div className="definition-item">
      <dt>
        <BilingualText english={english} japanese={japanese} mode="stacked" />
      </dt>
      <dd>{description || '—'}</dd>
    </div>
  );
}

/** Medical Info タブ: 基本情報・医療情報・疾患 */
export function MedicalInfoTab({ patient, onEdit }: MedicalInfoTabProps) {
  const editButton = (
    <button type="button" className="button button--secondary button--small" onClick={onEdit}>
      <BilingualText english="Edit" japanese="編集" mode="compact" />
    </button>
  );

  return (
    <>
      <section className="card" aria-labelledby="mi-basic">
        <div className="card__header">
          <h2 className="card__title" id="mi-basic">
            <BilingualText english="Basic Information" japanese="基本情報" mode="inline" />
          </h2>
          <div className="card__header-actions">{editButton}</div>
        </div>
        <dl className="definition-grid">
          <DefinitionItem english="Patient ID" japanese="患者ID" description={patient.patientId} />
          <DefinitionItem english="Name" japanese="氏名" description={patient.name} />
          <DefinitionItem english="Date of Birth" japanese="生年月日" description={`${formatDate(patient.dateOfBirth)}（${formatAge(patient.dateOfBirth)}）`} />
          <DefinitionItem english="Gender" japanese="性別" description={genderLabel(patient.gender)} />
          <DefinitionItem english="Room" japanese="病室" description={patient.room} />
          <DefinitionItem english="Blood Type" japanese="血液型" description={bloodTypeLabel(patient.bloodType)} />
          <DefinitionItem english="Registered" japanese="登録日時" description={formatDateTime(patient.createdAt)} />
          <DefinitionItem
            english="Profile Updated"
            japanese="患者情報の最終編集"
            description={patient.profileUpdatedAt ? formatDateTime(patient.profileUpdatedAt) : '編集履歴なし'}
          />
        </dl>
      </section>

      <section className="card" aria-labelledby="mi-medical">
        <div className="card__header">
          <h2 className="card__title" id="mi-medical">
            <BilingualText english="Medical Information" japanese="医療情報" mode="inline" />
          </h2>
          <div className="card__header-actions">{editButton}</div>
        </div>
        <AllergyAlert allergies={patient.allergies} />
        <dl className="definition-grid definition-grid--wide medical-definition-grid">
          <DefinitionItem english="Allergies" japanese="アレルギー" description={patient.allergies || '未登録'} />
          <DefinitionItem english="Medical History" japanese="既往歴" description={patient.medicalHistory} />
          <DefinitionItem english="Chief Complaint" japanese="主訴" description={patient.chiefComplaint} />
          <DefinitionItem english="Notes" japanese="備考" description={patient.notes} />
        </dl>
      </section>

      <section className="card" aria-labelledby="mi-diagnoses">
        <h2 className="card__title" id="mi-diagnoses">
          <BilingualText english="Diagnoses" japanese="疾患" mode="inline" />
        </h2>
        {patient.diagnoses.length === 0 ? (
          <p className="muted-text">疾患名は登録されていません。Edit / 編集からテンプレート選択または自由入力で追加できます。</p>
        ) : (
          <ol className="diagnosis-list">
            {patient.diagnoses.map((diagnosis, index) => (
              <li className="tag tag--static" key={diagnosis}>
                {index === 0 ? <span className="diagnosis-list__primary">主要</span> : null}
                {diagnosis}
              </li>
            ))}
          </ol>
        )}
        <p className="field__hint">疾患テンプレートは入力補助のための定型文言であり、診断を示すものではありません。先頭の疾患を主要疾患として表示します。</p>
      </section>
    </>
  );
}
