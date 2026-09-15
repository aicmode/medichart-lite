import type { Patient } from '../../types';
import type { PatientRecords } from '../../domain/selectors';
import { PatientAvatar } from '../PatientAvatar';
import { AllergyAlert } from '../AllergyAlert';
import { bloodTypeLabel, genderLabel } from '../../data/options';
import { formatAge, formatDateTime } from '../../utils/date';
import { getVitalFlags } from '../../domain/vitalFlags';

interface PatientHeaderCardProps {
  patient: Patient;
  records: PatientRecords;
}

/** 患者ヘッダー: 識別情報・アレルギー・未確認事項を常に上部へ表示する */
export function PatientHeaderCard({ patient, records }: PatientHeaderCardProps) {
  const openHandovers = records.handovers.filter((handover) => handover.status === 'open');
  const latestVital = records.vitalSigns[0] ?? null;
  const flags = latestVital ? getVitalFlags(latestVital) : [];

  return (
    <section className="patient-summary" aria-label="患者ヘッダー">
      <PatientAvatar name={patient.name} gender={patient.gender} decorative />
      <div className="patient-summary__identity">
        <h2>{patient.name}</h2>
        <span className="patient-summary__id mono">
          <span className="visually-hidden">患者ID </span>
          {patient.patientId}
        </span>
        <dl className="patient-facts">
          <div>
            <dt>Age / 年齢</dt>
            <dd>{formatAge(patient.dateOfBirth)}</dd>
          </div>
          <div>
            <dt>Gender / 性別</dt>
            <dd>{genderLabel(patient.gender)}</dd>
          </div>
          <div>
            <dt>Room / 病室</dt>
            <dd>{patient.room || '未登録'}</dd>
          </div>
          <div>
            <dt>Blood / 血液型</dt>
            <dd>{bloodTypeLabel(patient.bloodType)}</dd>
          </div>
        </dl>
        <p className="patient-summary__diagnosis">
          <span>Main Diagnosis / 主要疾患</span>
          <strong>{patient.diagnoses[0] || '未登録'}</strong>
          {patient.diagnoses.length > 1 ? <small>他 {patient.diagnoses.length - 1} 件</small> : null}
        </p>
        <p className="patient-summary__updated">
          Last Updated / 最終更新：<time dateTime={patient.updatedAt}>{formatDateTime(patient.updatedAt)}</time>
        </p>
      </div>
      <div className="patient-summary__side">
        <AllergyAlert allergies={patient.allergies} compact />
        {openHandovers.length > 0 || flags.length > 0 ? (
          <ul className="patient-summary__alerts">
            {openHandovers.length > 0 ? <li>未確認の申し送り {openHandovers.length} 件</li> : null}
            {flags.length > 0 ? <li>最新バイタルにデモ閾値外 {flags.length} 項目（参考表示）</li> : null}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
