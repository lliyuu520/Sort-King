/** 物品与分类：顶栏 4 盒按类收纳，装满消除。不依赖引擎。 */

export type CatKey =
  | "drink"
  | "snack"
  | "fruit"
  | "veg"
  | "stationery"
  | "toy"
  | "daily"
  | "animal"
  | "vehicle"
  | "clothes"
  | "sport";

export interface CategoryDef {
  key: CatKey;
  name: string;
  nameEn: string;
  color: string;
  soft: string;
  border: string;
}

export interface ItemDef {
  key: string;
  name: string;
  nameEn: string;
  emoji: string;
  category: CatKey;
  color: string;
  soft: string;
}

export interface LevelDef {
  id: number;
  name: string;
  nameEn: string;
  cats: CatKey[];
  goal: { type: "bins" | "score" | "streak"; value: number };
  hint?: string;
  hintEn?: string;
}

export const CATEGORIES: Record<CatKey, CategoryDef> = {
  drink: { key: "drink", name: "饮料", nameEn: "Drinks", color: "#5DADE2", soft: "#D6EAF8", border: "#3498DB" },
  snack: { key: "snack", name: "零食", nameEn: "Snacks", color: "#E59866", soft: "#FAE5D3", border: "#CA6F1E" },
  fruit: { key: "fruit", name: "水果", nameEn: "Fruit", color: "#58D68D", soft: "#D5F5E3", border: "#27AE60" },
  veg: { key: "veg", name: "蔬菜", nameEn: "Veggies", color: "#AF7AC5", soft: "#E8DAEF", border: "#8E44AD" },
  stationery: { key: "stationery", name: "文具", nameEn: "Stationery", color: "#F4D03F", soft: "#FCF3CF", border: "#D4AC0D" },
  toy: { key: "toy", name: "玩具", nameEn: "Toys", color: "#EC7063", soft: "#FADBD8", border: "#C0392B" },
  daily: { key: "daily", name: "日用品", nameEn: "Daily", color: "#48C9B0", soft: "#D1F2EB", border: "#1ABC9C" },
  animal: { key: "animal", name: "动物", nameEn: "Animals", color: "#F5B041", soft: "#FCF3CF", border: "#D68910" },
  vehicle: { key: "vehicle", name: "交通工具", nameEn: "Vehicles", color: "#5499C7", soft: "#D6EAF8", border: "#2471A3" },
  clothes: { key: "clothes", name: "服装", nameEn: "Clothes", color: "#C39BD3", soft: "#EBDEF0", border: "#8E44AD" },
  sport: { key: "sport", name: "运动", nameEn: "Sports", color: "#52BE80", soft: "#D5F5E3", border: "#1E8449" },
};

export const ITEMS: Record<string, ItemDef> = {
  cola: { key: "cola", name: "可乐", nameEn: "Cola", emoji: "🥤", category: "drink", color: "#E74C3C", soft: "#FADBD8" },
  sprite: { key: "sprite", name: "雪碧", nameEn: "Sprite", emoji: "🥤", category: "drink", color: "#58D68D", soft: "#D5F5E3" },
  mirinda: { key: "mirinda", name: "美年达", nameEn: "Mirinda", emoji: "🍊", category: "drink", color: "#E67E22", soft: "#FDEBD0" },
  milk: { key: "milk", name: "牛奶", nameEn: "Milk", emoji: "🥛", category: "drink", color: "#5D6D7E", soft: "#D5DBDB" },
  juice: { key: "juice", name: "果汁", nameEn: "Juice", emoji: "🧃", category: "drink", color: "#E67E22", soft: "#FDEBD0" },
  milktea: { key: "milktea", name: "奶茶", nameEn: "Milk Tea", emoji: "🧋", category: "drink", color: "#D2B48C", soft: "#F5E6D3" },
  coffee: { key: "coffee", name: "咖啡", nameEn: "Coffee", emoji: "☕", category: "drink", color: "#6F4E37", soft: "#E8D5C4" },
  yogurt: { key: "yogurt", name: "酸奶", nameEn: "Yogurt", emoji: "🥛", category: "drink", color: "#F1948A", soft: "#FADBD8" },
  choco: { key: "choco", name: "巧克力", nameEn: "Chocolate", emoji: "🍫", category: "snack", color: "#8B4513", soft: "#E8D5C4" },
  cookie: { key: "cookie", name: "饼干", nameEn: "Cookie", emoji: "🍪", category: "snack", color: "#D2691E", soft: "#F5E6D3" },
  noodle: { key: "noodle", name: "泡面", nameEn: "Noodles", emoji: "🍜", category: "snack", color: "#E67E22", soft: "#FDEBD0" },
  candy: { key: "candy", name: "糖果", nameEn: "Candy", emoji: "🍬", category: "snack", color: "#E74C3C", soft: "#FADBD8" },
  chips: { key: "chips", name: "薯片", nameEn: "Chips", emoji: "🍟", category: "snack", color: "#F4D03F", soft: "#FCF3CF" },
  cake: { key: "cake", name: "蛋糕", nameEn: "Cake", emoji: "🍰", category: "snack", color: "#F1948A", soft: "#FADBD8" },
  icecream: { key: "icecream", name: "冰淇淋", nameEn: "Ice Cream", emoji: "🍦", category: "snack", color: "#E8A0BF", soft: "#F5EEF8" },
  apple: { key: "apple", name: "苹果", nameEn: "Apple", emoji: "🍎", category: "fruit", color: "#C0392B", soft: "#F5B7B1" },
  banana: { key: "banana", name: "香蕉", nameEn: "Banana", emoji: "🍌", category: "fruit", color: "#D4AC0D", soft: "#FCF3CF" },
  grape: { key: "grape", name: "葡萄", nameEn: "Grape", emoji: "🍇", category: "fruit", color: "#7D3C98", soft: "#E8DAEF" },
  orange: { key: "orange", name: "橙子", nameEn: "Orange", emoji: "🍊", category: "fruit", color: "#E67E22", soft: "#FDEBD0" },
  watermelon: { key: "watermelon", name: "西瓜", nameEn: "Watermelon", emoji: "🍉", category: "fruit", color: "#27AE60", soft: "#D5F5E3" },
  strawberry: { key: "strawberry", name: "草莓", nameEn: "Strawberry", emoji: "🍓", category: "fruit", color: "#E74C3C", soft: "#FADBD8" },
  pumpkin: { key: "pumpkin", name: "南瓜", nameEn: "Pumpkin", emoji: "🎃", category: "veg", color: "#E67E22", soft: "#FDEBD0" },
  chives: { key: "chives", name: "韭菜", nameEn: "Chives", emoji: "🌿", category: "veg", color: "#27AE60", soft: "#D5F5E3" },
  carrot: { key: "carrot", name: "胡萝卜", nameEn: "Carrot", emoji: "🥕", category: "veg", color: "#E67E22", soft: "#FDEBD0" },
  tomato: { key: "tomato", name: "番茄", nameEn: "Tomato", emoji: "🍅", category: "veg", color: "#C0392B", soft: "#F5B7B1" },
  cabbage: { key: "cabbage", name: "卷心菜", nameEn: "Cabbage", emoji: "🥬", category: "veg", color: "#58D68D", soft: "#D5F5E3" },
  eggplant: { key: "eggplant", name: "茄子", nameEn: "Eggplant", emoji: "🍆", category: "veg", color: "#7D3C98", soft: "#E8DAEF" },
  cucumber: { key: "cucumber", name: "黄瓜", nameEn: "Cucumber", emoji: "🥒", category: "veg", color: "#27AE60", soft: "#D5F5E3" },
  corn: { key: "corn", name: "玉米", nameEn: "Corn", emoji: "🌽", category: "veg", color: "#F4D03F", soft: "#FCF3CF" },
  pencil: { key: "pencil", name: "铅笔", nameEn: "Pencil", emoji: "✏️", category: "stationery", color: "#F4D03F", soft: "#FCF3CF" },
  eraser: { key: "eraser", name: "橡皮", nameEn: "Eraser", emoji: "🧽", category: "stationery", color: "#F5B7B1", soft: "#FADBD8" },
  scissors: { key: "scissors", name: "剪刀", nameEn: "Scissors", emoji: "✂️", category: "stationery", color: "#E67E22", soft: "#FDEBD0" },
  book: { key: "book", name: "书本", nameEn: "Book", emoji: "📘", category: "stationery", color: "#48C9B0", soft: "#D1F2EB" },
  ball: { key: "ball", name: "皮球", nameEn: "Ball", emoji: "🏀", category: "toy", color: "#E67E22", soft: "#FDEBD0" },
  teddy: { key: "teddy", name: "泰迪熊", nameEn: "Teddy", emoji: "🧸", category: "toy", color: "#C0392B", soft: "#F5B7B1" },
  toycar: { key: "toycar", name: "玩具车", nameEn: "Toy Car", emoji: "🚗", category: "toy", color: "#E74C3C", soft: "#FADBD8" },
  balloon: { key: "balloon", name: "气球", nameEn: "Balloon", emoji: "🎈", category: "toy", color: "#E8A0BF", soft: "#F5EEF8" },
  toothbrush: { key: "toothbrush", name: "牙刷", nameEn: "Toothbrush", emoji: "🪥", category: "daily", color: "#1ABC9C", soft: "#D1F2EB" },
  soap: { key: "soap", name: "肥皂", nameEn: "Soap", emoji: "🧼", category: "daily", color: "#5DADE2", soft: "#D6EAF8" },
  umbrella: { key: "umbrella", name: "雨伞", nameEn: "Umbrella", emoji: "☂️", category: "daily", color: "#F4D03F", soft: "#FCF3CF" },
  towel: { key: "towel", name: "毛巾", nameEn: "Towel", emoji: "🧻", category: "daily", color: "#F1948A", soft: "#FADBD8" },
  cat: { key: "cat", name: "小猫", nameEn: "Cat", emoji: "🐱", category: "animal", color: "#F5B041", soft: "#FCF3CF" },
  dog: { key: "dog", name: "小狗", nameEn: "Dog", emoji: "🐶", category: "animal", color: "#D4AC0D", soft: "#FCF3CF" },
  rabbit: { key: "rabbit", name: "兔子", nameEn: "Rabbit", emoji: "🐰", category: "animal", color: "#F5B7B1", soft: "#FADBD8" },
  panda: { key: "panda", name: "熊猫", nameEn: "Panda", emoji: "🐼", category: "animal", color: "#5D6D7E", soft: "#D5DBDB" },
  bird: { key: "bird", name: "小鸟", nameEn: "Bird", emoji: "🐦", category: "animal", color: "#5DADE2", soft: "#D6EAF8" },
  elephant: { key: "elephant", name: "大象", nameEn: "Elephant", emoji: "🐘", category: "animal", color: "#85929E", soft: "#D5DBDB" },
  car: { key: "car", name: "小汽车", nameEn: "Car", emoji: "🚗", category: "vehicle", color: "#E74C3C", soft: "#FADBD8" },
  bus: { key: "bus", name: "公交车", nameEn: "Bus", emoji: "🚌", category: "vehicle", color: "#F4D03F", soft: "#FCF3CF" },
  bike: { key: "bike", name: "自行车", nameEn: "Bike", emoji: "🚲", category: "vehicle", color: "#58D68D", soft: "#D5F5E3" },
  plane: { key: "plane", name: "飞机", nameEn: "Plane", emoji: "✈️", category: "vehicle", color: "#5DADE2", soft: "#D6EAF8" },
  train: { key: "train", name: "火车", nameEn: "Train", emoji: "🚂", category: "vehicle", color: "#E67E22", soft: "#FDEBD0" },
  ship: { key: "ship", name: "轮船", nameEn: "Ship", emoji: "🚢", category: "vehicle", color: "#48C9B0", soft: "#D1F2EB" },
  tshirt: { key: "tshirt", name: "T恤", nameEn: "T-Shirt", emoji: "👕", category: "clothes", color: "#5DADE2", soft: "#D6EAF8" },
  pants: { key: "pants", name: "裤子", nameEn: "Pants", emoji: "👖", category: "clothes", color: "#5499C7", soft: "#D6EAF8" },
  dress: { key: "dress", name: "裙子", nameEn: "Dress", emoji: "👗", category: "clothes", color: "#E8A0BF", soft: "#F5EEF8" },
  hat: { key: "hat", name: "帽子", nameEn: "Hat", emoji: "🧢", category: "clothes", color: "#E74C3C", soft: "#FADBD8" },
  shoes: { key: "shoes", name: "鞋子", nameEn: "Shoes", emoji: "👟", category: "clothes", color: "#EC7063", soft: "#FADBD8" },
  socks: { key: "socks", name: "袜子", nameEn: "Socks", emoji: "🧦", category: "clothes", color: "#AF7AC5", soft: "#E8DAEF" },
  football: { key: "football", name: "足球", nameEn: "Football", emoji: "⚽", category: "sport", color: "#5D6D7E", soft: "#D5DBDB" },
  basketball: { key: "basketball", name: "篮球", nameEn: "Basketball", emoji: "🏀", category: "sport", color: "#E67E22", soft: "#FDEBD0" },
  tennis: { key: "tennis", name: "网球", nameEn: "Tennis", emoji: "🎾", category: "sport", color: "#F4D03F", soft: "#FCF3CF" },
  jump: { key: "jump", name: "跳绳", nameEn: "Jump Rope", emoji: "🪢", category: "sport", color: "#EC7063", soft: "#FADBD8" },
  pingpong: { key: "pingpong", name: "乒乓球", nameEn: "Ping Pong", emoji: "🏓", category: "sport", color: "#E74C3C", soft: "#FADBD8" },
  badminton: { key: "badminton", name: "羽毛球", nameEn: "Badminton", emoji: "🏸", category: "sport", color: "#48C9B0", soft: "#D1F2EB" },
};

export const DEFAULT_CATS: CatKey[] = ["drink", "snack", "fruit", "veg"];

export const CAT_MIXES: Record<string, CatKey[]> = {
  base: ["drink", "snack", "fruit", "veg"],
  school: ["drink", "fruit", "stationery", "snack"],
  play: ["snack", "fruit", "toy", "veg"],
  home: ["drink", "daily", "snack", "veg"],
  desk: ["stationery", "toy", "fruit", "drink"],
  bath: ["daily", "toy", "snack", "veg"],
  allround: ["stationery", "toy", "daily", "fruit"],
  zoo: ["animal", "fruit", "veg", "drink"],
  city: ["vehicle", "daily", "toy", "snack"],
  fashion: ["clothes", "daily", "toy", "stationery"],
  gym: ["sport", "drink", "animal", "fruit"],
};

export const BIN_MAX = 5;
export const SLOT_COUNT = 4;
export const DEAL_MS = 320;
export const DECK_SIZE = 24;
export const SCORE_PLACE = 20;
export const SCORE_BIN = [0, 100, 250, 500, 800, 1200, 1600, 2100];
export const STORAGE_PROGRESS = "sortking_v2";
export const STORAGE_LANG = "sortking_lang";
export const STORAGE_PRIVACY = "sortking_privacy";

export const LEVELS: LevelDef[] = [
  { id: 1, name: "认识盒子", nameEn: "Meet the Bins", cats: CAT_MIXES.base, goal: { type: "bins", value: 2 }, hint: "把同类物品拖进对应盒子，装满 5 个消除", hintEn: "Drag matching items into the right bin — fill 5 to clear" },
  { id: 2, name: "饮料专柜", nameEn: "Drink Aisle", cats: CAT_MIXES.base, goal: { type: "bins", value: 3 }, hint: "可乐雪碧都是饮料", hintEn: "Cola and Sprite are both drinks" },
  { id: 3, name: "果蔬上架", nameEn: "Produce Section", cats: CAT_MIXES.base, goal: { type: "bins", value: 3 } },
  { id: 4, name: "四盒全开", nameEn: "All Bins Open", cats: CAT_MIXES.base, goal: { type: "bins", value: 4 }, hint: "四个盒子等你填满", hintEn: "Four bins are waiting to be filled" },
  { id: 5, name: "文具开学", nameEn: "School Supplies", cats: CAT_MIXES.school, goal: { type: "bins", value: 4 }, hint: "铅笔橡皮都归文具盒", hintEn: "Pencils and erasers go to stationery" },
  { id: 6, name: "连续正确", nameEn: "Perfect Streak", cats: CAT_MIXES.school, goal: { type: "streak", value: 8 }, hint: "不要放错，连续正确 8 次", hintEn: "Don't miss — 8 correct in a row" },
  { id: 7, name: "玩具总动员", nameEn: "Toy Story", cats: CAT_MIXES.play, goal: { type: "bins", value: 5 }, hint: "皮球泰迪都是玩具", hintEn: "Balls and teddies are toys" },
  { id: 8, name: "蔬菜园丁", nameEn: "Veggie Garden", cats: CAT_MIXES.play, goal: { type: "bins", value: 5 } },
  { id: 9, name: "高分冲刺", nameEn: "High Score Rush", cats: CAT_MIXES.home, goal: { type: "score", value: 1600 }, hint: "牙刷肥皂属于日用品", hintEn: "Toothbrush and soap are daily items" },
  { id: 10, name: "完美收纳", nameEn: "Perfect Sort", cats: CAT_MIXES.home, goal: { type: "bins", value: 6 } },
  { id: 11, name: "书桌整理", nameEn: "Desk Tidy", cats: CAT_MIXES.desk, goal: { type: "bins", value: 7 } },
  { id: 12, name: "零失误", nameEn: "Zero Mistakes", cats: CAT_MIXES.desk, goal: { type: "streak", value: 12 } },
  { id: 13, name: "浴室时光", nameEn: "Bath Time", cats: CAT_MIXES.bath, goal: { type: "bins", value: 8 } },
  { id: 14, name: "分数专家", nameEn: "Score Expert", cats: CAT_MIXES.bath, goal: { type: "score", value: 2400 } },
  { id: 15, name: "极速归位", nameEn: "Speed Sorting", cats: CAT_MIXES.allround, goal: { type: "bins", value: 8 }, hint: "文具、玩具、日用品一起上", hintEn: "Stationery, toys and daily items together" },
  { id: 16, name: "连锁高手", nameEn: "Combo Master", cats: CAT_MIXES.allround, goal: { type: "streak", value: 15 } },
  { id: 17, name: "终整理", nameEn: "Final Tidy-Up", cats: CAT_MIXES.school, goal: { type: "bins", value: 10 } },
  { id: 18, name: "高分大师", nameEn: "Score Master", cats: CAT_MIXES.play, goal: { type: "score", value: 3200 } },
  { id: 19, name: "收纳之王", nameEn: "Storage Royalty", cats: CAT_MIXES.home, goal: { type: "bins", value: 12 } },
  { id: 20, name: "分类之王", nameEn: "Sort-King", cats: CAT_MIXES.allround, goal: { type: "bins", value: 14 }, hint: "终极整理，全部归位！", hintEn: "The ultimate sort — everything in its place!" },
  { id: 21, name: "动物园日", nameEn: "Zoo Day", cats: CAT_MIXES.zoo, goal: { type: "bins", value: 6 }, hint: "小猫小狗都是动物", hintEn: "Cats and dogs are both animals" },
  { id: 22, name: "城市交通", nameEn: "City Traffic", cats: CAT_MIXES.city, goal: { type: "bins", value: 8 }, hint: "汽车公交都是交通工具", hintEn: "Cars and buses are vehicles" },
  { id: 23, name: "衣橱整理", nameEn: "Closet Sort", cats: CAT_MIXES.fashion, goal: { type: "bins", value: 10 }, hint: "T恤裤子都归服装", hintEn: "T-shirts and pants go to clothes" },
  { id: 24, name: "运动健将", nameEn: "Sports Star", cats: CAT_MIXES.gym, goal: { type: "bins", value: 12 }, hint: "足球篮球都是运动器材", hintEn: "Footballs and basketballs are sports gear" },
];

export function itemsOfCat(cat: CatKey): ItemDef[] {
  const out: ItemDef[] = [];
  for (const k in ITEMS) {
    if (ITEMS[k].category === cat) out.push(ITEMS[k]);
  }
  return out;
}

export function itemDef(key: string): ItemDef | undefined {
  return ITEMS[key];
}

export function catDef(key: string): CategoryDef | undefined {
  return CATEGORIES[key as CatKey];
}
