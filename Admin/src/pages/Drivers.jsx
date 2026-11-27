import { useState } from 'react'
import { useAction, useResource } from '../hooks.js'
import { formatRupees, plural, shortDate, VEHICLES } from '../utils.js'
import FileViewer from '../components/FileViewer.jsx'
import { ConfirmModal, FormModal } from '../components/Modal.jsx'
import { Badge, LoadState, PageHeader, Stale, Table } from '../components/ui.jsx'

const ACTIVITY = {
  on_delivery: ['blue', 'On delivery'],
  on_pickup: ['blue', 'On pickup'],
  free: ['green', 'Free'],
  offline: ['grey', 'Offline'],
  deactivated: ['red', 'Deactivated'],
}

const DOCUMENTS = [
  ['licence', 'View licence'],
  ['identity', 'View ID proof'],
  ['registration', 'View vehicle RC'],
]

export default function Drivers() {
  const { data, error, reload } = useResource('/drivers', { interval: 15_000 })
  const [run, busy] = useAction()
  const [dialog, setDialog] = useState(null)
  const [file, setFile] = useState(null)

  if (!data) return <LoadState error={error} onRetry={reload} />

  const close = () => setDialog(null)

  const act = async (path, body, message) => {
    const result = await run(path, { body, message })
    if (result) close()
    reload()
  }

  return (
    <>
      <PageHeader title="Drivers">
        <button type="button" className="button button--blue" onClick={() => setDialog({ type: 'add' })}>
          + Add driver
        </button>
      </PageHeader>
      <Stale error={error} />

      <h2 className="section-title">Waiting for approval</h2>
      {data.waiting.length === 0 ? (
        <p className="card empty">No applications are waiting.</p>
      ) : (
        <div className="applicants">
          {data.waiting.map((driver) => (
            <article key={driver.id} className="card applicant">
              <h3>{driver.name}</h3>
              <p>
                {VEHICLES[driver.vehicle.type]} · {driver.vehicle.plate || 'No number plate'} · Applied{' '}
                {shortDate(driver.appliedAt)}
              </p>
              <div className="applicant__documents">
                {DOCUMENTS.map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    className="button button--tile"
                    onClick={() =>
                      setFile({
                        title: `${driver.name}: ${label.replace('View ', '')}`,
                        path: `/drivers/${driver.id}/documents/${type}`,
                      })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="applicant__decision">
                <button
                  type="button"
                  className="button button--danger-outline"
                  disabled={busy}
                  onClick={() => setDialog({ type: 'reject', driver })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="button button--green"
                  disabled={busy}
                  onClick={() => act(`/drivers/${driver.id}/approve`, {}, `${driver.name} is approved`)}
                >
                  Approve
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {data.incomplete.length > 0 && (
        <p className="hint">
          Still uploading documents: {data.incomplete.map((d) => `${d.name} (${d.phone})`).join(', ')}
        </p>
      )}

      <h2 className="section-title">All drivers</h2>
      <Table
        columns={['Driver', 'Status', 'Jobs today', 'Completed (month)', 'On time', 'Cash held', 'Account']}
        empty="No approved drivers yet."
      >
        {data.drivers.map((driver) => {
          const [tone, label] = ACTIVITY[driver.activity]
          return (
            <tr key={driver.id}>
              <td className="strong">{driver.name}</td>
              <td>
                <Badge tone={tone}>{label}</Badge>
              </td>
              <td>{driver.jobsToday}</td>
              <td>{driver.completedMonth}</td>
              <td>{driver.onTimePercent === null ? '–' : `${driver.onTimePercent}%`}</td>
              <td>{formatRupees(driver.cashHeld)}</td>
              <td>
                <button
                  type="button"
                  className="button button--outline button--small"
                  disabled={busy}
                  onClick={() => setDialog({ type: driver.active ? 'deactivate' : 'activate', driver })}
                >
                  {driver.active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          )
        })}
      </Table>

      {dialog?.type === 'reject' && (
        <ConfirmModal
          title={`Reject ${dialog.driver.name}?`}
          message="The driver app will ask them to upload all three documents again."
          confirmLabel="Reject documents"
          danger
          busy={busy}
          onConfirm={() => act(`/drivers/${dialog.driver.id}/reject`, {}, 'Application rejected')}
          onClose={close}
        />
      )}
      {(dialog?.type === 'deactivate' || dialog?.type === 'activate') && (
        <ConfirmModal
          title={`${dialog.type === 'activate' ? 'Activate' : 'Deactivate'} ${dialog.driver.name}?`}
          message={
            dialog.type === 'activate'
              ? 'The driver can log in again.'
              : [
                  'The driver is logged out and their open jobs go back to unassigned.',
                  dialog.driver.cashHeld > 0 &&
                    `They still hold ${formatRupees(dialog.driver.cashHeld)} in cash.`,
                ]
                  .filter(Boolean)
                  .join(' ')
          }
          confirmLabel={dialog.type === 'activate' ? 'Activate' : 'Deactivate'}
          danger={dialog.type === 'deactivate'}
          busy={busy}
          onConfirm={() =>
            act(
              `/drivers/${dialog.driver.id}/active`,
              { active: dialog.type === 'activate' },
              dialog.type === 'activate' ? 'Driver activated' : 'Driver deactivated',
            )
          }
          onClose={close}
        />
      )}
      {dialog?.type === 'add' && (
        <FormModal
          title="Add driver"
          submitLabel="Add driver"
          busy={busy}
          fields={[
            { name: 'name', label: 'Full name', maxLength: 60 },
            { name: 'phone', label: 'Mobile number', type: 'tel', maxLength: 15 },
            { name: 'type', label: 'Vehicle type', options: Object.entries(VEHICLES) },
            { name: 'plate', label: 'Number plate', placeholder: 'MP09 AB 1234', maxLength: 14 },
          ]}
          onSubmit={(values) =>
            act(
              '/drivers',
              values,
              `Driver added. They now log in and upload ${plural(DOCUMENTS.length, 'document')}.`,
            )
          }
          onClose={close}
        />
      )}
      {file && <FileViewer {...file} onClose={() => setFile(null)} />}
    </>
  )
}
