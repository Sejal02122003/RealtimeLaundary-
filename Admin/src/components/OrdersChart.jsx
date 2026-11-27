import { plural, shortDate, weekday } from '../utils.js'

/** Orders per day for the last seven days. The last bar is today. */
export default function OrdersChart({ days }) {
  const max = Math.max(...days.map((d) => d.count), 1)
  const today = days.at(-1)

  return (
    <section className="card chart">
      <div className="card__head">
        <h2>Orders, last 7 days</h2>
        <span>Today: {plural(today.count, 'order')}</span>
      </div>

      <div className="chart__plot" aria-hidden="true">
        {days.map(({ day, count }, i) => {
          const isToday = i === days.length - 1
          return (
            <div key={day} className={isToday ? 'chart__column is-today' : 'chart__column'}>
              <div className="chart__track">
                <span className="chart__value">{count}</span>
                <span className="chart__bar" style={{ height: `${(count / max) * 82}%` }} />
                <span className="chart__tooltip">
                  {shortDate(`${day}T12:00:00+05:30`)}: {plural(count, 'order')}
                </span>
              </div>
              <span className="chart__day">{isToday ? 'Today' : weekday(day)}</span>
            </div>
          )
        })}
      </div>

      <table className="sr-only">
        <caption>Orders, last 7 days</caption>
        <tbody>
          {days.map(({ day, count }) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
