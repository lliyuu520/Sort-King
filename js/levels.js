/**
 * 物品与分类：顶栏 4 盒按类收纳，装满消除。
 * 同一分类下多种不同物品都可归入同一盒（可乐/雪碧/美年达 → 饮料）。
 * name 为中文，nameEn 为英文（由 I18N.localized 选择）。
 * 每局固定 4 盒；关卡可轮换不同四类组合。
 */
const CATEGORIES = {
  drink: {
    key: "drink",
    name: "饮料",
    nameEn: "Drinks",
    color: "#5DADE2",
    soft: "#D6EAF8",
    border: "#3498DB",
  },
  snack: {
    key: "snack",
    name: "零食",
    nameEn: "Snacks",
    color: "#E59866",
    soft: "#FAE5D3",
    border: "#CA6F1E",
  },
  fruit: {
    key: "fruit",
    name: "水果",
    nameEn: "Fruit",
    color: "#58D68D",
    soft: "#D5F5E3",
    border: "#27AE60",
  },
  veg: {
    key: "veg",
    name: "蔬菜",
    nameEn: "Veggies",
    color: "#AF7AC5",
    soft: "#E8DAEF",
    border: "#8E44AD",
  },
  stationery: {
    key: "stationery",
    name: "文具",
    nameEn: "Stationery",
    color: "#F4D03F",
    soft: "#FCF3CF",
    border: "#D4AC0D",
  },
  toy: {
    key: "toy",
    name: "玩具",
    nameEn: "Toys",
    color: "#EC7063",
    soft: "#FADBD8",
    border: "#C0392B",
  },
  daily: {
    key: "daily",
    name: "日用品",
    nameEn: "Daily",
    color: "#48C9B0",
    soft: "#D1F2EB",
    border: "#1ABC9C",
  },
  animal: {
    key: "animal",
    name: "动物",
    nameEn: "Animals",
    color: "#F5B041",
    soft: "#FCF3CF",
    border: "#D68910",
  },
  vehicle: {
    key: "vehicle",
    name: "交通工具",
    nameEn: "Vehicles",
    color: "#5499C7",
    soft: "#D6EAF8",
    border: "#2471A3",
  },
  clothes: {
    key: "clothes",
    name: "服装",
    nameEn: "Clothes",
    color: "#C39BD3",
    soft: "#EBDEF0",
    border: "#8E44AD",
  },
  sport: {
    key: "sport",
    name: "运动",
    nameEn: "Sports",
    color: "#52BE80",
    soft: "#D5F5E3",
    border: "#1E8449",
  },
};

/** 物品目录：category 决定归入哪个盒子 */
const ITEMS = {
  // ---- drink ----
  cola: { key: "cola", name: "可乐", nameEn: "Cola", emoji: "🥤", category: "drink", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/cola.png" },
  sprite: { key: "sprite", name: "雪碧", nameEn: "Sprite", emoji: "🥤", category: "drink", color: "#58D68D", soft: "#D5F5E3", img: "assets/items/sprite.png" },
  mirinda: { key: "mirinda", name: "美年达", nameEn: "Mirinda", emoji: "🍊", category: "drink", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/mirinda.png" },
  milk: { key: "milk", name: "牛奶", nameEn: "Milk", emoji: "🥛", category: "drink", color: "#5D6D7E", soft: "#D5DBDB", img: "assets/items/milk.png" },
  juice: { key: "juice", name: "果汁", nameEn: "Juice", emoji: "🧃", category: "drink", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/juice.png" },
  milktea: { key: "milktea", name: "奶茶", nameEn: "Milk Tea", emoji: "🧋", category: "drink", color: "#D2B48C", soft: "#F5E6D3", img: "assets/items/milktea.png" },
  coffee: { key: "coffee", name: "咖啡", nameEn: "Coffee", emoji: "☕", category: "drink", color: "#6F4E37", soft: "#E8D5C4", img: "assets/items/coffee.png" },
  yogurt: { key: "yogurt", name: "酸奶", nameEn: "Yogurt", emoji: "🥛", category: "drink", color: "#F1948A", soft: "#FADBD8", img: "assets/items/yogurt.png" },

  // ---- snack ----
  choco: { key: "choco", name: "巧克力", nameEn: "Chocolate", emoji: "🍫", category: "snack", color: "#8B4513", soft: "#E8D5C4", img: "assets/items/choco.png" },
  cookie: { key: "cookie", name: "饼干", nameEn: "Cookie", emoji: "🍪", category: "snack", color: "#D2691E", soft: "#F5E6D3", img: "assets/items/cookie.png" },
  noodle: { key: "noodle", name: "泡面", nameEn: "Noodles", emoji: "🍜", category: "snack", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/noodle.png" },
  candy: { key: "candy", name: "糖果", nameEn: "Candy", emoji: "🍬", category: "snack", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/candy.png" },
  chips: { key: "chips", name: "薯片", nameEn: "Chips", emoji: "🍟", category: "snack", color: "#F4D03F", soft: "#FCF3CF", img: "assets/items/chips.png" },
  cake: { key: "cake", name: "蛋糕", nameEn: "Cake", emoji: "🍰", category: "snack", color: "#F1948A", soft: "#FADBD8", img: "assets/items/cake.png" },
  icecream: { key: "icecream", name: "冰淇淋", nameEn: "Ice Cream", emoji: "🍦", category: "snack", color: "#E8A0BF", soft: "#F5EEF8", img: "assets/items/icecream.png" },

  // ---- fruit ----
  apple: { key: "apple", name: "苹果", nameEn: "Apple", emoji: "🍎", category: "fruit", color: "#C0392B", soft: "#F5B7B1", img: "assets/items/apple.png" },
  banana: { key: "banana", name: "香蕉", nameEn: "Banana", emoji: "🍌", category: "fruit", color: "#D4AC0D", soft: "#FCF3CF", img: "assets/items/banana.png" },
  grape: { key: "grape", name: "葡萄", nameEn: "Grape", emoji: "🍇", category: "fruit", color: "#7D3C98", soft: "#E8DAEF", img: "assets/items/grape.png" },
  orange: { key: "orange", name: "橙子", nameEn: "Orange", emoji: "🍊", category: "fruit", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/orange.png" },
  watermelon: { key: "watermelon", name: "西瓜", nameEn: "Watermelon", emoji: "🍉", category: "fruit", color: "#27AE60", soft: "#D5F5E3", img: "assets/items/watermelon.png" },
  strawberry: { key: "strawberry", name: "草莓", nameEn: "Strawberry", emoji: "🍓", category: "fruit", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/strawberry.png" },

  // ---- veg ----
  pumpkin: { key: "pumpkin", name: "南瓜", nameEn: "Pumpkin", emoji: "🎃", category: "veg", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/pumpkin.png" },
  chives: { key: "chives", name: "韭菜", nameEn: "Chives", emoji: "🌿", category: "veg", color: "#27AE60", soft: "#D5F5E3", img: "assets/items/chives.png" },
  carrot: { key: "carrot", name: "胡萝卜", nameEn: "Carrot", emoji: "🥕", category: "veg", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/carrot.png" },
  tomato: { key: "tomato", name: "番茄", nameEn: "Tomato", emoji: "🍅", category: "veg", color: "#C0392B", soft: "#F5B7B1", img: "assets/items/tomato.png" },
  cabbage: { key: "cabbage", name: "卷心菜", nameEn: "Cabbage", emoji: "🥬", category: "veg", color: "#58D68D", soft: "#D5F5E3", img: "assets/items/cabbage.png" },
  eggplant: { key: "eggplant", name: "茄子", nameEn: "Eggplant", emoji: "🍆", category: "veg", color: "#7D3C98", soft: "#E8DAEF", img: "assets/items/eggplant.png" },
  cucumber: { key: "cucumber", name: "黄瓜", nameEn: "Cucumber", emoji: "🥒", category: "veg", color: "#27AE60", soft: "#D5F5E3", img: "assets/items/cucumber.png" },
  corn: { key: "corn", name: "玉米", nameEn: "Corn", emoji: "🌽", category: "veg", color: "#F4D03F", soft: "#FCF3CF", img: "assets/items/corn.png" },

  // ---- stationery 文具 ----
  pencil: { key: "pencil", name: "铅笔", nameEn: "Pencil", emoji: "✏️", category: "stationery", color: "#F4D03F", soft: "#FCF3CF", img: "assets/items/pencil.png" },
  eraser: { key: "eraser", name: "橡皮", nameEn: "Eraser", emoji: "🧽", category: "stationery", color: "#F5B7B1", soft: "#FADBD8", img: "assets/items/eraser.png" },
  scissors: { key: "scissors", name: "剪刀", nameEn: "Scissors", emoji: "✂️", category: "stationery", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/scissors.png" },
  book: { key: "book", name: "书本", nameEn: "Book", emoji: "📘", category: "stationery", color: "#48C9B0", soft: "#D1F2EB", img: "assets/items/book.png" },

  // ---- toy 玩具 ----
  ball: { key: "ball", name: "皮球", nameEn: "Ball", emoji: "🏀", category: "toy", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/ball.png" },
  teddy: { key: "teddy", name: "泰迪熊", nameEn: "Teddy", emoji: "🧸", category: "toy", color: "#C0392B", soft: "#F5B7B1", img: "assets/items/teddy.png" },
  toycar: { key: "toycar", name: "玩具车", nameEn: "Toy Car", emoji: "🚗", category: "toy", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/toycar.png" },
  balloon: { key: "balloon", name: "气球", nameEn: "Balloon", emoji: "🎈", category: "toy", color: "#E8A0BF", soft: "#F5EEF8", img: "assets/items/balloon.png" },

  // ---- daily 日用品 ----
  toothbrush: { key: "toothbrush", name: "牙刷", nameEn: "Toothbrush", emoji: "🪥", category: "daily", color: "#1ABC9C", soft: "#D1F2EB", img: "assets/items/toothbrush.png" },
  soap: { key: "soap", name: "肥皂", nameEn: "Soap", emoji: "🧼", category: "daily", color: "#5DADE2", soft: "#D6EAF8", img: "assets/items/soap.png" },
  umbrella: { key: "umbrella", name: "雨伞", nameEn: "Umbrella", emoji: "☂️", category: "daily", color: "#F4D03F", soft: "#FCF3CF", img: "assets/items/umbrella.png" },
  towel: { key: "towel", name: "毛巾", nameEn: "Towel", emoji: "🧻", category: "daily", color: "#F1948A", soft: "#FADBD8", img: "assets/items/towel.png" },

  // ---- animal 动物 ----
  cat: { key: "cat", name: "小猫", nameEn: "Cat", emoji: "🐱", category: "animal", color: "#F5B041", soft: "#FCF3CF", img: "assets/items/cat.png" },
  dog: { key: "dog", name: "小狗", nameEn: "Dog", emoji: "🐶", category: "animal", color: "#D4AC0D", soft: "#FCF3CF", img: "assets/items/dog.png" },
  rabbit: { key: "rabbit", name: "兔子", nameEn: "Rabbit", emoji: "🐰", category: "animal", color: "#F5B7B1", soft: "#FADBD8", img: "assets/items/rabbit.png" },
  panda: { key: "panda", name: "熊猫", nameEn: "Panda", emoji: "🐼", category: "animal", color: "#5D6D7E", soft: "#D5DBDB", img: "assets/items/panda.png" },
  bird: { key: "bird", name: "小鸟", nameEn: "Bird", emoji: "🐦", category: "animal", color: "#5DADE2", soft: "#D6EAF8", img: "assets/items/bird.png" },
  elephant: { key: "elephant", name: "大象", nameEn: "Elephant", emoji: "🐘", category: "animal", color: "#85929E", soft: "#D5DBDB", img: "assets/items/elephant.png" },

  // ---- vehicle 交通工具 ----
  car: { key: "car", name: "小汽车", nameEn: "Car", emoji: "🚗", category: "vehicle", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/car.png" },
  bus: { key: "bus", name: "公交车", nameEn: "Bus", emoji: "🚌", category: "vehicle", color: "#F4D03F", soft: "#FCF3CF", img: "assets/items/bus.png" },
  bike: { key: "bike", name: "自行车", nameEn: "Bike", emoji: "🚲", category: "vehicle", color: "#58D68D", soft: "#D5F5E3", img: "assets/items/bike.png" },
  plane: { key: "plane", name: "飞机", nameEn: "Plane", emoji: "✈️", category: "vehicle", color: "#5DADE2", soft: "#D6EAF8", img: "assets/items/plane.png" },
  train: { key: "train", name: "火车", nameEn: "Train", emoji: "🚂", category: "vehicle", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/train.png" },
  ship: { key: "ship", name: "轮船", nameEn: "Ship", emoji: "🚢", category: "vehicle", color: "#48C9B0", soft: "#D1F2EB", img: "assets/items/ship.png" },

  // ---- clothes 服装 ----
  tshirt: { key: "tshirt", name: "T恤", nameEn: "T-Shirt", emoji: "👕", category: "clothes", color: "#5DADE2", soft: "#D6EAF8", img: "assets/items/tshirt.png" },
  pants: { key: "pants", name: "裤子", nameEn: "Pants", emoji: "👖", category: "clothes", color: "#5499C7", soft: "#D6EAF8", img: "assets/items/pants.png" },
  dress: { key: "dress", name: "裙子", nameEn: "Dress", emoji: "👗", category: "clothes", color: "#E8A0BF", soft: "#F5EEF8", img: "assets/items/dress.png" },
  hat: { key: "hat", name: "帽子", nameEn: "Hat", emoji: "🧢", category: "clothes", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/hat.png" },
  shoes: { key: "shoes", name: "鞋子", nameEn: "Shoes", emoji: "👟", category: "clothes", color: "#EC7063", soft: "#FADBD8", img: "assets/items/shoes.png" },
  socks: { key: "socks", name: "袜子", nameEn: "Socks", emoji: "🧦", category: "clothes", color: "#AF7AC5", soft: "#E8DAEF", img: "assets/items/socks.png" },

  // ---- sport 运动 ----
  football: { key: "football", name: "足球", nameEn: "Football", emoji: "⚽", category: "sport", color: "#5D6D7E", soft: "#D5DBDB", img: "assets/items/football.png" },
  basketball: { key: "basketball", name: "篮球", nameEn: "Basketball", emoji: "🏀", category: "sport", color: "#E67E22", soft: "#FDEBD0", img: "assets/items/basketball.png" },
  tennis: { key: "tennis", name: "网球", nameEn: "Tennis", emoji: "🎾", category: "sport", color: "#F4D03F", soft: "#FCF3CF", img: "assets/items/tennis.png" },
  jump: { key: "jump", name: "跳绳", nameEn: "Jump Rope", emoji: "🪢", category: "sport", color: "#EC7063", soft: "#FADBD8", img: "assets/items/jump.png" },
  pingpong: { key: "pingpong", name: "乒乓球", nameEn: "Ping Pong", emoji: "🏓", category: "sport", color: "#E74C3C", soft: "#FADBD8", img: "assets/items/pingpong.png" },
  badminton: { key: "badminton", name: "羽毛球", nameEn: "Badminton", emoji: "🏸", category: "sport", color: "#48C9B0", soft: "#D1F2EB", img: "assets/items/badminton.png" },
};

/** 默认四盒（无限模式 / 新手关） */
const DEFAULT_CATS = ["drink", "snack", "fruit", "veg"];

/** 关卡四类组合包：每局仍是 4 盒，轮换不同主题 */
const CAT_MIXES = {
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

const BIN_MAX = 5;
const BOARD_W = 6;
const BOARD_H = 6;

/**
 * 关卡目标：
 *   bins   — 装满并消除 N 个盒
 *   score  — 达到分数
 *   streak — 连续正确 N 次
 */
const LEVELS = [
  { id: 1, name: "认识盒子", nameEn: "Meet the Bins", cats: CAT_MIXES.base, initial: 12, goal: { type: "bins", value: 2 }, hint: "把同类物品拖进对应盒子，装满 5 个消除", hintEn: "Drag matching items into the right bin — fill 5 to clear" },
  { id: 2, name: "饮料专柜", nameEn: "Drink Aisle", cats: CAT_MIXES.base, initial: 14, goal: { type: "bins", value: 3 }, hint: "可乐雪碧都是饮料", hintEn: "Cola and Sprite are both drinks" },
  { id: 3, name: "果蔬上架", nameEn: "Produce Section", cats: CAT_MIXES.base, initial: 14, goal: { type: "bins", value: 3 } },
  { id: 4, name: "四盒全开", nameEn: "All Bins Open", cats: CAT_MIXES.base, initial: 16, goal: { type: "bins", value: 4 }, hint: "四个盒子等你填满", hintEn: "Four bins are waiting to be filled" },
  { id: 5, name: "文具开学", nameEn: "School Supplies", cats: CAT_MIXES.school, initial: 16, goal: { type: "bins", value: 4 }, hint: "铅笔橡皮都归文具盒", hintEn: "Pencils and erasers go to stationery" },
  { id: 6, name: "连续正确", nameEn: "Perfect Streak", cats: CAT_MIXES.school, initial: 16, goal: { type: "streak", value: 8 }, hint: "不要放错，连续正确 8 次", hintEn: "Don't miss — 8 correct in a row" },
  { id: 7, name: "玩具总动员", nameEn: "Toy Story", cats: CAT_MIXES.play, initial: 18, goal: { type: "bins", value: 5 }, hint: "皮球泰迪都是玩具", hintEn: "Balls and teddies are toys" },
  { id: 8, name: "蔬菜园丁", nameEn: "Veggie Garden", cats: CAT_MIXES.play, initial: 18, goal: { type: "bins", value: 5 } },
  { id: 9, name: "高分冲刺", nameEn: "High Score Rush", cats: CAT_MIXES.home, initial: 18, goal: { type: "score", value: 1600 }, hint: "牙刷肥皂属于日用品", hintEn: "Toothbrush and soap are daily items" },
  { id: 10, name: "完美收纳", nameEn: "Perfect Sort", cats: CAT_MIXES.home, initial: 18, goal: { type: "bins", value: 6 } },
  { id: 11, name: "书桌整理", nameEn: "Desk Tidy", cats: CAT_MIXES.desk, initial: 20, goal: { type: "bins", value: 7 } },
  { id: 12, name: "零失误", nameEn: "Zero Mistakes", cats: CAT_MIXES.desk, initial: 20, goal: { type: "streak", value: 12 } },
  { id: 13, name: "浴室时光", nameEn: "Bath Time", cats: CAT_MIXES.bath, initial: 20, goal: { type: "bins", value: 8 } },
  { id: 14, name: "分数专家", nameEn: "Score Expert", cats: CAT_MIXES.bath, initial: 20, goal: { type: "score", value: 2400 } },
  { id: 15, name: "极速归位", nameEn: "Speed Sorting", cats: CAT_MIXES.allround, initial: 20, goal: { type: "bins", value: 8 }, hint: "文具、玩具、日用品一起上", hintEn: "Stationery, toys and daily items together" },
  { id: 16, name: "连锁高手", nameEn: "Combo Master", cats: CAT_MIXES.allround, initial: 22, goal: { type: "streak", value: 15 } },
  { id: 17, name: "终整理", nameEn: "Final Tidy-Up", cats: CAT_MIXES.school, initial: 22, goal: { type: "bins", value: 10 } },
  { id: 18, name: "高分大师", nameEn: "Score Master", cats: CAT_MIXES.play, initial: 22, goal: { type: "score", value: 3200 } },
  { id: 19, name: "收纳之王", nameEn: "Storage Royalty", cats: CAT_MIXES.home, initial: 24, goal: { type: "bins", value: 12 } },
  { id: 20, name: "分类之王", nameEn: "Sort-King", cats: CAT_MIXES.allround, initial: 24, goal: { type: "bins", value: 14 }, hint: "终极整理，全部归位！", hintEn: "The ultimate sort — everything in its place!" },
  { id: 21, name: "动物园日", nameEn: "Zoo Day", cats: CAT_MIXES.zoo, initial: 18, goal: { type: "bins", value: 6 }, hint: "小猫小狗都是动物", hintEn: "Cats and dogs are both animals" },
  { id: 22, name: "城市交通", nameEn: "City Traffic", cats: CAT_MIXES.city, initial: 20, goal: { type: "bins", value: 8 }, hint: "汽车公交都是交通工具", hintEn: "Cars and buses are vehicles" },
  { id: 23, name: "衣橱整理", nameEn: "Closet Sort", cats: CAT_MIXES.fashion, initial: 22, goal: { type: "bins", value: 10 }, hint: "T恤裤子都归服装", hintEn: "T-shirts and pants go to clothes" },
  { id: 24, name: "运动健将", nameEn: "Sports Star", cats: CAT_MIXES.gym, initial: 24, goal: { type: "bins", value: 12 }, hint: "足球篮球都是运动器材", hintEn: "Footballs and basketballs are sports gear" },
];

if (typeof globalThis !== "undefined") {
  globalThis.CATEGORIES = CATEGORIES;
  globalThis.ITEMS = ITEMS;
  globalThis.DEFAULT_CATS = DEFAULT_CATS;
  globalThis.CAT_MIXES = CAT_MIXES;
  globalThis.BIN_MAX = BIN_MAX;
  globalThis.LEVELS = LEVELS;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CATEGORIES, ITEMS, DEFAULT_CATS, CAT_MIXES, BIN_MAX, BOARD_W, BOARD_H, LEVELS };
}
