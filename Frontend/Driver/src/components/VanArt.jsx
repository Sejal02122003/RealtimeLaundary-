// The animated delivery van from the customer app's welcome screen.
import { DeliveryVan } from '../../../User/src/components/LaundryArt.jsx'
import '../../../User/src/components/LaundryScene.css'

export default function VanArt({ className }) {
  return (
    <div className={className} aria-hidden="true">
      <DeliveryVan />
    </div>
  )
}
