import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PropertyComparison from '../property-comparison'
import { Property } from '@/interfaces'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}))

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn(),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  horizontalListSortingStrategy: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(),
    },
  },
}))

const mockProperty1: Property = {
  id: '1',
  listing_key: 'TEST001',
  property_type: 'ResidentialSale',
  address: '123 Test Street',
  location: 'Test Location',
  list_price: 500000,
  bedrooms: 3,
  bathrooms: 2,
  living_area_sqft: 1500,
  lot_size_sqft: 5000,
  status: 'Active',
  statusColor: 'green',
  publicRemarks: 'Test remarks',
  favorite: false,
  _id: '1',
  images: ['/test-image.jpg'],
  city: 'Test City',
  state: 'CA',
  zip_code: '12345',
  latitude: 37.7749,
  longitude: -122.4194,
  createdAt: '2024-01-01',
  county: 'Test County',
  updatedAt: '2024-01-01',
  image: '/test-image.jpg'
}

const mockProperty2: Property = {
  ...mockProperty1,
  id: '2',
  listing_key: 'TEST002',
  address: '456 Test Avenue',
  list_price: 750000,
  bedrooms: 4,
  bathrooms: 3,
  living_area_sqft: 2000,
}

describe('PropertyComparison', () => {
  it('renders without crashing', () => {
    render(<PropertyComparison />)
    expect(screen.getByText('Property Comparison')).toBeInTheDocument()
  })

  it('displays initial properties', () => {
    render(<PropertyComparison initialProperties={[mockProperty1, mockProperty2]} />)
    
    expect(screen.getByText('123 Test Street')).toBeInTheDocument()
    expect(screen.getByText('456 Test Avenue')).toBeInTheDocument()
  })

  it('shows comparison table with property details', () => {
    render(<PropertyComparison initialProperties={[mockProperty1]} />)
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Financial Analysis')).toBeInTheDocument()
    expect(screen.getByText('Neighborhood Scores')).toBeInTheDocument()
  })

  it('calculates price per square foot correctly', () => {
    render(<PropertyComparison initialProperties={[mockProperty1]} />)
    
    // Property 1: $500,000 / 1,500 sqft = $333 per sqft
    expect(screen.getByText('$333')).toBeInTheDocument()
  })

  it('displays mortgage calculator', () => {
    render(<PropertyComparison initialProperties={[mockProperty1]} />)
    
    expect(screen.getByText('Down Payment %')).toBeInTheDocument()
    expect(screen.getByText('Interest Rate %')).toBeInTheDocument()
    expect(screen.getByText('Loan Term (years)')).toBeInTheDocument()
  })

  it('displays neighborhood scores', () => {
    render(<PropertyComparison initialProperties={[mockProperty1]} />)
    
    expect(screen.getByText('Walkability')).toBeInTheDocument()
    expect(screen.getByText('Transit Score')).toBeInTheDocument()
    expect(screen.getByText('Safety Score')).toBeInTheDocument()
    expect(screen.getByText('School Rating')).toBeInTheDocument()
  })

  it('shows empty slots when no properties provided', () => {
    render(<PropertyComparison />)
    
    const emptySlots = screen.getAllByText('Drag property here or click to add')
    expect(emptySlots).toHaveLength(4) // Should have 4 empty slots
  })

  it('calls onPropertyAdd when add button is clicked', () => {
    const mockOnPropertyAdd = jest.fn()
    render(<PropertyComparison onPropertyAdd={mockOnPropertyAdd} />)
    
    const addButton = screen.getByText('Add Properties to Compare')
    fireEvent.click(addButton)
    
    expect(mockOnPropertyAdd).toHaveBeenCalled()
  })
})
