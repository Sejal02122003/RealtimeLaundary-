import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useAction, useResource } from '../hooks.js'
import { formatRupees } from '../utils.js'
import { FormModal } from '../components/Modal.jsx'
import { Chips, LoadState, PageHeader, Stale, Table, Toggle } from '../components/ui.jsx'

// Always offered as tabs; other categories appear once they have a service.
const MAIN_CATEGORIES = ['wash-iron', 'by-weight', 'dry-clean', 'packages']
const TAB_LABELS = { 'wash-iron': 'Wash & iron' }

export default function Services() {
  const { query, navigate } = useRouter()
  const { data, error, reload, replace } = useResource('/catalog')
  const [run, busy] = useAction()
  const [dialog, setDialog] = useState(null)

  if (!data) return <LoadState error={error} onRetry={reload} />

  const category = data.categories[query.get('category')] ? query.get('category') : MAIN_CATEGORIES[0]
  const tabs = Object.entries(data.categories)
    .filter(([id]) => MAIN_CATEGORIES.includes(id) || data.services.some((s) => s.category === id))
    .map(([id, label]) => [id, TAB_LABELS[id] ?? label])

  /** Every change returns the whole catalogue, which replaces what is shown. */
  const change = async (path, body, message, method = 'PATCH') => {
    const result = await run(`/catalog${path}`, { method, body, message })
    if (result) {
      replace(result)
      setDialog(null)
    }
    return result
  }

  return (
    <>
      <PageHeader title="Services & pricing">
        <button type="button" className="button button--blue" onClick={() => setDialog('service')}>
          + Add service
        </button>
      </PageHeader>
      <Stale error={error} />

      <div className="split split--services">
        <div>
          <Chips
            label="Service category"
            options={tabs}
            value={category}
            onChange={(id) => navigate(`/services?category=${id}`, { replace: true })}
          />
          <Table
            columns={['Service', 'Pricing model', 'Price (₹)', 'Available']}
            empty="No services in this category yet."
          >
            {data.services
              .filter((s) => s.category === category)
              .map((service) => (
                <tr key={service.id}>
                  <td className="strong">{service.name}</td>
                  <td>{data.pricingModels[service.pricingModel]}</td>
                  <td>
                    <PriceInput
                      key={service.price}
                      service={service}
                      onSave={(price) =>
                        change(`/services/${service.id}`, { price }, `${service.name} price saved`)
                      }
                    />
                  </td>
                  <td>
                    <Toggle
                      on={service.available}
                      label={`${service.name} available`}
                      disabled={busy}
                      onClick={() =>
                        change(`/services/${service.id}`, { available: !service.available })
                      }
                    />
                  </td>
                </tr>
              ))}
          </Table>

          <section className="card block slots">
            <h2>Pickup &amp; delivery slots</h2>
            <p className="hint">Tap a slot to open or close it for booking.</p>
            <div>
              {data.slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={slot.open}
                  disabled={busy}
                  onClick={() => change(`/slots/${slot.id}`, { open: !slot.open })}
                >
                  {slot.label} · {slot.open ? 'Open' : 'Closed'}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div>
          <OrderRules
            key={JSON.stringify(data.rules)}
            rules={data.rules}
            busy={busy}
            onSave={(rules) => change('/rules', rules, 'Order rules saved')}
          />
          <section className="card block offers">
            <h2>Offers</h2>
            <ul>
              {data.offers.map((offer) => (
                <li key={offer.id}>
                  <button
                    type="button"
                    aria-pressed={offer.active}
                    title={offer.active ? 'Pause this offer' : 'Activate this offer'}
                    disabled={busy}
                    onClick={() =>
                      change(
                        `/offers/${offer.id}`,
                        { active: !offer.active },
                        `${offer.code} ${offer.active ? 'paused' : 'activated'}`,
                      )
                    }
                  >
                    <strong>{offer.code}</strong> · {describe(offer)} ·{' '}
                    {offer.active ? 'Active' : 'Paused'}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="button button--outline button--block" onClick={() => setDialog('offer')}>
              + New offer
            </button>
          </section>
        </div>
      </div>

      {dialog === 'service' && (
        <FormModal
          title="Add service"
          submitLabel="Add service"
          busy={busy}
          fields={[
            { name: 'category', label: 'Category', options: Object.entries(data.categories), value: category },
            { name: 'name', label: 'Service name', maxLength: 60 },
            { name: 'pricingModel', label: 'Pricing model', options: Object.entries(data.pricingModels) },
            { name: 'price', label: 'Price (₹)', type: 'number', min: 1 },
          ]}
          onSubmit={(values) => change('/services', values, 'Service added', 'POST')}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'offer' && (
        <FormModal
          title="New offer"
          submitLabel="Create offer"
          busy={busy}
          fields={[
            { name: 'code', label: 'Offer code', maxLength: 20, placeholder: 'FRESH40' },
            { name: 'type', label: 'Discount type', options: [['flat', 'Amount off (₹)'], ['percent', 'Percent off']] },
            { name: 'value', label: 'Discount', type: 'number', min: 1 },
            { name: 'minimum', label: 'Minimum order (₹)', type: 'number', min: 0, value: 0 },
            { name: 'firstOrderOnly', label: 'First order only', type: 'checkbox' },
          ]}
          onSubmit={(values) => change('/offers', values, 'Offer created', 'POST')}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

function describe({ type, value, minimum, firstOrderOnly }) {
  let text = type === 'flat' ? `${formatRupees(value)} off` : `${value}% off`
  if (minimum) text += ` above ${formatRupees(minimum)}`
  if (firstOrderOnly) text += ' first order'
  return text
}

/** Saves when the admin presses Enter or leaves the box. */
function PriceInput({ service, onSave }) {
  const [value, setValue] = useState(String(service.price))

  const save = async () => {
    if (value === String(service.price)) return
    if (!(await onSave(value))) setValue(String(service.price))
  }

  return (
    <input
      className="price"
      inputMode="numeric"
      aria-label={`${service.name} price in rupees`}
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )
}

function OrderRules({ rules, busy, onSave }) {
  const [minOrder, setMinOrder] = useState(String(rules.minOrder))
  const [taxRate, setTaxRate] = useState(String(rules.taxRate))
  const [codEnabled, setCodEnabled] = useState(rules.codEnabled)

  return (
    <form
      className="card block form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ minOrder, taxRate, codEnabled })
      }}
    >
      <h2>Order rules</h2>
      <label className="field">
        Minimum order value (₹)
        <input inputMode="numeric" value={minOrder} onChange={(e) => setMinOrder(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="field">
        Tax rate (%)
        <input inputMode="numeric" value={taxRate} onChange={(e) => setTaxRate(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="check">
        <input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />
        Allow cash on delivery
      </label>
      <button type="submit" className="button button--ink button--block" disabled={busy}>
        Save changes
      </button>
    </form>
  )
}
