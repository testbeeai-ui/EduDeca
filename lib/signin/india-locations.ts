export const INDIA_LOCATIONS: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar"],
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Varanasi"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
};

export const INDIA_STATES = Object.keys(INDIA_LOCATIONS);

export function citiesForState(state: string): string[] {
  return INDIA_LOCATIONS[state] ?? [];
}
