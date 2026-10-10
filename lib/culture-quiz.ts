const tourism = { name: "Vietnam Tourism", url: "https://vietnam.travel/node/1216" };
const museum = { name: "Bảo tàng Phụ nữ Nam Bộ", url: "https://baotangphunu.com/4266-2/" };
export const quizQuestions = [
  { id: "trousers", question: "Áo dài đương đại thường mặc cùng món nào?", options: ["Quần", "Chỉ mặc riêng áo", "Luôn phải có váy xòe"], answer: 0, explanation: "Vietnam Tourism hướng dẫn mặc áo dài cùng quần. Phom áo và cách phối có nhiều biến thể.", source: tourism, garment: "ao-dai" },
  { id: "panels", question: "Áo ngũ thân có bao nhiêu thân áo?", options: ["Bốn", "Năm", "Sáu"], answer: 1, explanation: "Bài giới thiệu của bảo tàng mô tả năm thân: bốn bên ngoài và một bên trong.", source: museum, garment: "ngu-than" },
  { id: "buttons", question: "Theo bài của Bảo tàng Phụ nữ Nam Bộ, áo ngũ thân có bao nhiêu khuy?", options: ["Ba", "Bảy", "Năm"], answer: 2, explanation: "Nguồn mô tả năm khuy, gắn với cách diễn giải biểu trưng trong Nho học.", source: museum, garment: "ngu-than" },
  { id: "sleeves", question: "Hai dạng tay áo ngũ thân được bài bảo tàng nêu là gì?", options: ["Tay thụng và tay hẹp", "Chỉ có tay ngắn", "Luôn không có tay"], answer: 0, explanation: "Tay thụng và tay hẹp là hai dạng được giới thiệu. Một hình minh họa không đại diện mọi biến thể.", source: museum, garment: "ngu-than" },
  { id: "evolution", question: "Nhận định nào phù hợp với lịch sử áo dài trong bài Vietnam Tourism?", options: ["Kiểu dáng luôn cố định", "Kiểu dáng thay đổi qua thời gian", "Chỉ xuất hiện trong lễ cưới"], answer: 1, explanation: "Bài viết trình bày quá trình thay đổi của áo dài, gồm những cải tiến ở thế kỷ XX.", source: tourism, garment: "ao-dai" },
  { id: "skirt", question: "Bài bảo tàng nhắc phụ nữ Đàng Ngoài mặc áo tứ thân cùng món nào?", options: ["Quần jeans", "Váy đụp đen", "Váy tennis"], answer: 1, explanation: "Nguồn nhắc áo tứ thân với váy đụp đen trong bối cảnh lịch sử đang trình bày.", source: museum, garment: "tu-than" },
] as const;
