import Basket from './Basket.jsx'
import { DeliveryVan, HangingShirt, SteamIron, WashingMachine } from './LaundryArt.jsx'
import './LaundryScene.css'

const PIECES = [
  { id: 'basket', Art: Basket },
  { id: 'washer', Art: WashingMachine },
  { id: 'shirt', Art: HangingShirt },
  { id: 'iron', Art: SteamIron },
  { id: 'van', Art: DeliveryVan },
]

/** All the laundry artwork together: the basket in the middle, one piece per corner. */
export default function LaundryScene() {
  return (
    <div
      className="scene"
      role="img"
      aria-label="Laundry basket, washing machine, dry cleaned shirt, steam iron and delivery van"
    >
      {PIECES.map(({ id, Art }) => (
        <div key={id} className={`scene__piece scene__piece--${id}`}>
          <Art />
        </div>
      ))}
    </div>
  )
}
