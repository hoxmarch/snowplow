export interface RoadSegment {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number; // width in world units
  length: number; // length in world units
  isDriveway?: boolean;
}

export interface BuildingData {
  id: string;
  type: 'house' | 'diner' | 'gas_station' | 'town_hall' | 'water_tower' | 'garage';
  x: number;
  z: number;
  rotation: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  roofColor: string;
  name?: string;
}

export interface PropData {
  type: 'tree' | 'streetlamp' | 'mailbox' | 'hydrant' | 'bench' | 'snowman' | 'holiday_tree' | 'fence';
  x: number;
  z: number;
  rotation?: number;
  scale?: number;
}

export interface TownLayout {
  roads: RoadSegment[];
  buildings: BuildingData[];
  props: PropData[];
  spawnPoint: { x: number; z: number; rotation: number };
}

export function generateTownLayout(): TownLayout {
  const roads: RoadSegment[] = [
    // Main Street (East-West arterial boulevard)
    { id: 'main_st_w', name: 'Main Street West', x: -31, z: 0, width: 46, length: 10 },
    { id: 'main_st_c', name: 'Town Square Boulevard', x: 0, z: 0, width: 16, length: 12 },
    { id: 'main_st_e', name: 'Main Street East', x: 31, z: 0, width: 46, length: 10 },

    // North-South Avenues
    { id: 'maple_ave_n', name: 'Maple Avenue North', x: -25, z: -26.5, width: 9, length: 43 },
    { id: 'maple_ave_s', name: 'Maple Avenue South', x: -25, z: 26.5, width: 9, length: 43 },

    { id: 'pine_ridge_n', name: 'Pine Ridge North', x: 25, z: -26.5, width: 9, length: 43 },
    { id: 'pine_ridge_s', name: 'Pine Ridge South', x: 25, z: 26.5, width: 9, length: 43 },

    // Cross street North & South
    { id: 'elm_st_n', name: 'Elm Street North', x: 0, z: -41, width: 8, length: 14 },
    { id: 'oak_lane_s', name: 'Oak Lane South', x: 0, z: 14, width: 8, length: 16 },

    // Town Square Loop & Plaza
    { id: 'plaza_loop', name: 'Town Hall Circle', x: 0, z: -13, width: 18, length: 14 },

    // Commercial Lots & Driveways (comfortably in front of buildings)
    { id: 'diner_lot', name: "Bob's Diner Parking", x: -42, z: 12.5, width: 14, length: 13, isDriveway: true },
    { id: 'gas_lot', name: 'Vintage Gas Pump Apron', x: 42, z: 12.5, width: 14, length: 13, isDriveway: true },

    // Residential Driveways (reach from avenue to front of homes)
    { id: 'dw_mrs_baker', name: "Mrs. Baker's Driveway", x: -29.5, z: -28, width: 8, length: 5, isDriveway: true },
    { id: 'dw_sheriff', name: "Sheriff's Cabin Driveway", x: -20.5, z: -28, width: 8, length: 5, isDriveway: true },
    { id: 'dw_cozy_cottage', name: 'Bluebird Cottage Drive', x: -29.5, z: 28, width: 8, length: 5, isDriveway: true },
    { id: 'dw_doctor', name: "Town Clinic Driveway", x: 20.5, z: -28, width: 8, length: 5, isDriveway: true },
    { id: 'dw_mayor', name: "Mayor's Manor Driveway", x: 29.5, z: -28, width: 8, length: 5, isDriveway: true },
    { id: 'dw_school', name: 'School Bus Drop-off Loop', x: 32, z: 24, width: 12, length: 12, isDriveway: true },

    // Snow Plow Depot Driveway (Home base)
    { id: 'depot_yard', name: 'Public Works Plow Depot', x: 0, z: 24, width: 10, length: 8, isDriveway: true },
  ];

  const buildings: BuildingData[] = [
    // Town Hall (Prominent North Center)
    {
      id: 'town_hall',
      type: 'town_hall',
      name: 'Frosty Hollow Town Hall',
      x: 0,
      z: -27,
      rotation: 0,
      width: 14,
      depth: 10,
      height: 9,
      color: '#fffbf0', // warm stately stone
      roofColor: '#b91c1c', // rich festive Christmas red
    },

    // Bob's 50s Diner (South-West Main St)
    {
      id: 'bobs_diner',
      type: 'diner',
      name: "Bob's Hot Cocoa & Diner",
      x: -42,
      z: 24,
      rotation: 0,
      width: 12,
      depth: 8,
      height: 5,
      color: '#06b6d4', // vivid retro turquoise
      roofColor: '#f43f5e', // glowing holiday cherry red
    },

    // Vintage Gas & Repair Station (South-East Main St)
    {
      id: 'gas_station',
      type: 'gas_station',
      name: "Chet's Gas & Service",
      x: 42,
      z: 24,
      rotation: 0,
      width: 12,
      depth: 8,
      height: 5,
      color: '#f59e0b', // rich vintage amber gold
      roofColor: '#1e293b', // deep slate
    },

    // Water Tower (Hill on North-East edge)
    {
      id: 'water_tower',
      type: 'water_tower',
      name: 'Frosty Hollow Water Tower',
      x: 46,
      z: -46,
      rotation: 0.2,
      width: 7,
      depth: 7,
      height: 14,
      color: '#38bdf8',
      roofColor: '#0284c7',
    },

    // Public Works Garage (Center-South)
    {
      id: 'garage_depot',
      type: 'garage',
      name: 'Town Plow Depot',
      x: 0,
      z: 32,
      rotation: 0,
      width: 12,
      depth: 8,
      height: 5.5,
      color: '#94a3b8',
      roofColor: '#0f766e', // spruce green
    },

    // Residential Homes (Maple Ave & Pine Ridge)
    // House 1: Mrs. Baker (North-West)
    {
      id: 'house_baker',
      type: 'house',
      name: "Mrs. Baker's Gingerbread Home",
      x: -38,
      z: -28,
      rotation: Math.PI * 0.5,
      width: 8,
      depth: 7,
      height: 6,
      color: '#d97706', // warm gingerbread ochre
      roofColor: '#dc2626', // holiday berry red
    },
    // House 2: Sheriff's Log Home (North-Center-West)
    {
      id: 'house_sheriff',
      type: 'house',
      name: "Sheriff's Cabin",
      x: -12,
      z: -28,
      rotation: -Math.PI * 0.5,
      width: 7,
      depth: 7,
      height: 5.5,
      color: '#92400e', // rich cedar wood
      roofColor: '#15803d', // festive pine evergreen
    },
    // House 3: Bluebird Cottage (South-West)
    {
      id: 'house_bluebird',
      type: 'house',
      name: 'Bluebird Cottage',
      x: -38,
      z: 36,
      rotation: 0,
      width: 8,
      depth: 7,
      height: 5.8,
      color: '#0ea5e9', // vibrant frosty sapphire blue
      roofColor: '#e11d48', // crimson red roof
    },
    // House 4: Town Clinic (North-East)
    {
      id: 'house_clinic',
      type: 'house',
      name: 'Town Clinic & Pharmacy',
      x: 12,
      z: -28,
      rotation: Math.PI * 0.5,
      width: 8,
      depth: 8,
      height: 6,
      color: '#ffffff', // clean snowy white
      roofColor: '#ef4444', // candy-cane red roof
    },
    // House 5: Mayor's Victorian Manor (Far North-East)
    {
      id: 'house_mayor',
      type: 'house',
      name: "Mayor's Victorian Manor",
      x: 38,
      z: -28,
      rotation: -Math.PI * 0.5,
      width: 9,
      depth: 8,
      height: 7,
      color: '#9333ea', // regal holiday plum
      roofColor: '#d97706', // holiday gold trim roof
    },
    // House 6: Schoolhouse / Library (South-East)
    {
      id: 'house_school',
      type: 'house',
      name: 'Frosty Hollow Little School',
      x: 38,
      z: 36,
      rotation: 0,
      width: 10,
      depth: 8,
      height: 6.5,
      color: '#dc2626', // classic bright red schoolhouse
      roofColor: '#1e293b',
    },
  ];

  const props: PropData[] = [];

  // Giant decorated town Christmas tree in center plaza
  props.push({ type: 'holiday_tree', x: 0, z: -12, scale: 1.4 });

  // Cheerful Snowmen around town (breakable!)
  props.push({ type: 'snowman', x: -4, z: -10, rotation: 0.3 });
  props.push({ type: 'snowman', x: 5, z: -10, rotation: -0.4 });
  props.push({ type: 'snowman', x: -35, z: -22, rotation: 0.8 });
  props.push({ type: 'snowman', x: 35, z: 22, rotation: -0.6 });
  props.push({ type: 'snowman', x: -40, z: 10, rotation: 0.2 });
  props.push({ type: 'snowman', x: -33, z: 14, rotation: 0.5 }); // Near Bob's Diner
  props.push({ type: 'snowman', x: 34, z: 14, rotation: -0.5 }); // Near Gas Station
  props.push({ type: 'snowman', x: 14, z: -20, rotation: 0.1 }); // Near Clinic
  props.push({ type: 'snowman', x: 28, z: 24, rotation: -0.8 }); // Near Schoolhouse
  props.push({ type: 'snowman', x: -18, z: 5, rotation: 1.2 });  // Along Main Street curb
  props.push({ type: 'snowman', x: 18, z: -5, rotation: -1.0 }); // Along Main Street curb

  // Streetlamps along Main St & Avenues (with warm glowing lanterns)
  const lampPositions = [
    { x: -50, z: -6 }, { x: -30, z: -6 }, { x: -10, z: -6 }, { x: 10, z: -6 }, { x: 30, z: -6 }, { x: 50, z: -6 },
    { x: -50, z: 6 }, { x: -30, z: 6 }, { x: -10, z: 6 }, { x: 10, z: 6 }, { x: 30, z: 6 }, { x: 50, z: 6 },
    { x: -20, z: -38 }, { x: -20, z: -18 }, { x: -20, z: 18 }, { x: -20, z: 38 },
    { x: 20, z: -38 }, { x: 20, z: -18 }, { x: 20, z: 18 }, { x: 20, z: 38 },
  ];
  lampPositions.forEach((pos) => {
    props.push({ type: 'streetlamp', x: pos.x, z: pos.z });
  });

  // Mailboxes near driveways
  props.push({ type: 'mailbox', x: -30, z: -25, rotation: 0 });
  props.push({ type: 'mailbox', x: -14, z: -25, rotation: 0 });
  props.push({ type: 'mailbox', x: 14, z: -25, rotation: 0 });
  props.push({ type: 'mailbox', x: 30, z: -25, rotation: 0 });

  // Fire hydrants
  props.push({ type: 'hydrant', x: -15, z: 7 });
  props.push({ type: 'hydrant', x: 15, z: -7 });
  props.push({ type: 'hydrant', x: -35, z: 7 });

  // Park benches in Town Square
  props.push({ type: 'bench', x: -6, z: -16, rotation: Math.PI * 0.5 });
  props.push({ type: 'bench', x: 6, z: -16, rotation: -Math.PI * 0.5 });
  props.push({ type: 'bench', x: 0, z: -6, rotation: Math.PI });

  // Fluffy snowy pine trees lining the avenues, yards, and perimeter (strictly off roads)
  const treePositions = [
    // Outer perimeter forest grove (well beyond roads)
    { x: -60, z: -40 }, { x: -60, z: -20 }, { x: -60, z: 20 }, { x: -60, z: 40 },
    { x: 60, z: -40 }, { x: 60, z: -20 }, { x: 60, z: 20 }, { x: 60, z: 40 },
    { x: -44, z: -54 }, { x: -20, z: -54 }, { x: 20, z: -54 }, { x: 44, z: -54 },
    { x: -44, z: 54 }, { x: -20, z: 54 }, { x: 20, z: 54 }, { x: 44, z: 54 },
    // Residential front yards & gardens
    { x: -44, z: -36 }, { x: -44, z: -20 },
    { x: -14, z: -38 }, { x: -8, z: -38 },
    { x: 8, z: -38 }, { x: 14, z: -38 },
    { x: 44, z: -36 }, { x: 44, z: -20 },
    { x: -46, z: 36 }, { x: -46, z: 44 },
    { x: 46, z: 36 }, { x: 46, z: 44 },
    // Town Square park corners & side lawns
    { x: -14, z: -10 }, { x: 14, z: -10 },
    { x: -14, z: 12 }, { x: 14, z: 12 },
  ];
  treePositions.forEach((pos, idx) => {
    props.push({
      type: 'tree',
      x: pos.x,
      z: pos.z,
      scale: 0.85 + ((idx % 5) * 0.1),
      rotation: (idx * 0.7) % (Math.PI * 2),
    });
  });

  return {
    roads,
    buildings,
    props,
    spawnPoint: { x: 0, z: 20, rotation: Math.PI }, // Facing out of plow depot toward Main St
  };
}
