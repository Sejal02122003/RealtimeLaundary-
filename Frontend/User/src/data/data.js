// Demo data. Replace with API calls once the backend endpoints exist.

export const CATEGORIES = [
  { id: 'wash-iron', label: 'Wash & iron', note: 'Priced per piece' },
  { id: 'by-weight', label: 'By weight', note: 'Priced per kilogram' },
  { id: 'dry-clean', label: 'Dry clean', note: 'Priced per piece' },
  { id: 'packages', label: 'Packages', note: 'Priced per package' },
  { id: 'ironing', label: 'Ironing', note: 'Priced per piece' },
  { id: 'premium', label: 'Premium', note: 'Priced per piece' },
]

const item = (id, category, name, description, price, unit, nouns) => ({
  id,
  category,
  name,
  description,
  price,
  unit,
  nouns,
})

export const ITEMS = [
  item('shirt', 'wash-iron', 'Shirt', 'Washed and pressed', 25, 'piece', ['shirt', 'shirts']),
  item('trousers', 'wash-iron', 'Trousers', 'Washed and pressed', 30, 'piece', ['trousers', 'trousers']),
  item('bedsheet', 'wash-iron', 'Bedsheet', 'Double size', 80, 'piece', ['bedsheet', 'bedsheets']),
  item('kurta', 'wash-iron', 'Kurta', 'Gentle wash', 35, 'piece', ['kurta', 'kurtas']),

  item('wash-fold', 'by-weight', 'Wash & fold', 'Everyday clothes', 70, 'kg', ['kg wash & fold', 'kg wash & fold']),
  item('wash-press', 'by-weight', 'Wash & press', 'Washed, then ironed', 110, 'kg', ['kg wash & press', 'kg wash & press']),

  item('blazer', 'dry-clean', 'Blazer', 'Dry cleaned and steamed', 250, 'piece', ['blazer', 'blazers']),
  item('saree', 'dry-clean', 'Saree', 'Silk safe', 180, 'piece', ['saree', 'sarees']),
  item('sweater', 'dry-clean', 'Sweater', 'Wool care', 140, 'piece', ['sweater', 'sweaters']),

  item('family-pack', 'packages', 'Family pack', '10 kg wash and fold', 599, 'pack', ['family pack', 'family packs']),
  item('solo-pack', 'packages', 'Solo pack', '5 kg wash and fold', 329, 'pack', ['solo pack', 'solo packs']),

  item('iron-shirt', 'ironing', 'Shirt ironing', 'Steam pressed', 12, 'piece', ['ironed shirt', 'ironed shirts']),
  item('iron-trousers', 'ironing', 'Trousers ironing', 'Steam pressed', 15, 'piece', ['ironed trousers', 'ironed trousers']),

  item('suit', 'premium', 'Suit (2 piece)', 'Hand finished', 450, 'piece', ['suit', 'suits']),
  item('lehenga', 'premium', 'Lehenga', 'Delicate fabric care', 600, 'piece', ['lehenga', 'lehengas']),
]

export const SLOTS = [
  { id: '8-10', label: '8 – 10 AM', startHour: 8 },
  { id: '10-12', label: '10 AM – 12 PM', startHour: 10 },
  { id: '14-16', label: '2 – 4 PM', startHour: 14 },
  { id: '17-19', label: '5 – 7 PM', startHour: 17 },
]

export const STAGES = [
  'Booking confirmed',
  'Pickup assigned',
  'Picked up',
  'Processing / washing',
  'Ready for delivery',
  'Out for delivery',
  'Delivered',
]

export const PICKED_UP_STAGE = 2

export const PAYMENT_METHODS = {
  online: { label: 'Pay online', short: 'Paid online' },
  wallet: { label: 'Wallet', short: 'Paid by wallet' },
  cod: { label: 'Cash on delivery', short: 'COD' },
}

export const SPONSOR = 'Priya Sharma'
export const PENDING_EARNINGS = 140
export const TOTAL_EARNED = 2160

const member = (name, joined, earned) => ({ name, joined, earned })

export const TEAM = [
  [
    member('Sunil Mehta', '12 Nov', 120),
    member('Neha Jain', '4 Nov', 95),
    member('Arjun Khanna', '28 Oct', 80),
    member('Farah Shaikh', null, 0),
    member('Rohit Verma', '19 Oct', 65),
  ],
  [
    member('Ritu Patel', '9 Nov', 30),
    member('Karan Malhotra', '6 Nov', 25),
    member('Meera Nair', '2 Nov', 40),
    member('Imran Ali', '30 Oct', 20),
    member('Pooja Rao', '24 Oct', 35),
    member('Dev Sinha', '18 Oct', 15),
    member('Anjali Gupta', '11 Oct', 20),
    member('Vikas Tiwari', null, 0),
  ],
  [
    member('Sneha Kulkarni', '15 Nov', 10),
    member('Manoj Yadav', '7 Nov', 15),
    member('Tanya Bose', '29 Oct', 10),
    member('Harish Menon', '21 Oct', 5),
    member('Lata Joshi', null, 0),
  ],
]

const order = (id, quantities) => ({
  id,
  lines: Object.entries(quantities).map(([itemId, qty]) => ({ itemId, qty })),
})

export const INITIAL_STATE = {
  session: false,
  pendingContact: '',
  user: { name: 'Anita Singh', phone: '+91 98765 43210', referralCode: 'ANITA219' },
  addresses: [
    { id: 'home', label: 'Home', line: '204, Shanti Residency, Vijay Nagar', area: 'Vijay Nagar' },
    { id: 'office', label: 'Office', line: '3rd floor, Orbit Tower, AB Road', area: 'AB Road' },
  ],
  defaultAddressId: 'home',
  booking: {
    category: 'wash-iron',
    cart: { shirt: 4, trousers: 2, bedsheet: 1 },
    addressId: null,
    date: null,
    slot: null,
    instructions: '',
    payment: 'online',
  },
  orders: [
    {
      ...order('FF-1042', { shirt: 4, trousers: 2, bedsheet: 1 }),
      status: 'active',
      stage: 5,
      total: 236,
      payment: 'cod',
      date: '2026-11-26',
      eta: 'by 6:30 PM',
      otp: '7305',
      partner: 'Ravi Kumar',
      times: ['26 Nov, 8:10', '8:25', '10:40', '27 Nov', '28 Nov, 2:15', '5:05 PM', 'by 6:30'],
    },
    {
      ...order('FF-1047', { blazer: 1, saree: 1 }),
      status: 'active',
      stage: 3,
      total: 430,
      payment: 'online',
      date: '2026-11-25',
      eta: 'on 27 Nov',
      otp: '4182',
      partner: 'Ravi Kumar',
      times: ['25 Nov, 9:00', '9:20', '11:05', '26 Nov', '', '', '27 Nov'],
    },
    {
      ...order('FF-1021', { 'wash-fold': 3, bedsheet: 1 }),
      status: 'delivered',
      stage: 6,
      total: 310,
      payment: 'wallet',
      date: '2026-11-22',
      partner: 'Ravi Kumar',
      times: ['22 Nov, 8:40', '8:55', '10:10', '22 Nov', '23 Nov', '24 Nov', '24 Nov'],
    },
  ],
  wallet: {
    balance: 1240,
    transactions: [
      { id: 't1', type: 'earning', title: 'Level 1 commission', detail: 'Sunil M. · Order #FF-1039', date: '2026-11-25', amount: 120 },
      { id: 't2', type: 'spent', title: 'Order payment', detail: '#FF-1021', date: '2026-11-22', amount: -310 },
      { id: 't3', type: 'earning', title: 'Level 2 commission', detail: 'Ritu P. · Order #FF-1008', date: '2026-11-20', amount: 30 },
      { id: 't4', type: 'earning', title: 'Team incentive', detail: 'November reward', date: '', month: '2026-11', amount: 230 },
      { id: 't5', type: 'spent', title: 'Withdrawal paid', detail: 'To UPI', date: '2026-11-15', amount: -800 },
    ],
  },
  notifications: [
    { id: 'n1', title: 'Your order is out for delivery', detail: '#FF-1042 · 5:05 PM' },
    { id: 'n2', title: 'You earned ₹120 commission', detail: 'From Sunil’s order · Yesterday' },
  ],
  unread: true,
}
