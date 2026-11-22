-- Replace the sample catalog with the shop's real stock list.
-- Run this in MySQL Workbench on localhost port 3306, database laxmi_kirana.
-- That is the database used by `npm run dev`.
--
-- This keeps the owner login and store settings.
-- It deletes old products, old categories, and old sample orders.
-- It does not drop the database.
--
-- Money is stored in paisa. Rs 240 is written as 24000.
-- The site shows that as Rs 240.
-- Customer price is the SP column. "Sp per unit" is not stored.
-- Stock is the first number in the stock cell (2 Box = 2, 9 pcs = 9).
-- Rows where the photo was hard to read are marked REVIEW.

USE laxmi_kirana;

START TRANSACTION;

DELETE FROM orderstatusevent;
DELETE FROM orderedit;
DELETE FROM orderitem;
DELETE FROM `order`;
DELETE FROM product;
DELETE FROM category;

INSERT INTO category (id, name, slug, sortOrder, createdAt, updatedAt) VALUES
  ('cat_biscuits', 'Biscuits', 'biscuits', 0, NOW(3), NOW(3)),
  ('cat_health', 'Health', 'health', 1, NOW(3), NOW(3)),
  ('cat_tea', 'Tea', 'tea', 2, NOW(3), NOW(3)),
  ('cat_kitchen', 'Kitchen', 'kitchen', 3, NOW(3), NOW(3)),
  ('cat_snacks', 'Snacks', 'snacks', 4, NOW(3), NOW(3));

INSERT INTO product
  (id, name, slug, description, price, unit, stock, lowStockThreshold, image, keywords, active, categoryId, createdAt, updatedAt)
VALUES
  ('p001', 'Britannia Digestive', 'britannia-digestive-100-g', '', 24000, '100 g', 2, 5, '', 'britannia digestive biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p002', 'Britannia Digestive', 'britannia-digestive-75-g', '', 12500, '75 g', 2, 5, '', 'britannia digestive biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p003', 'Nebico Digestive', 'nebico-digestive-200-g', '', 10000, '200 g', 2, 5, '', 'nebico digestive biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p004', 'Eat Fit Digestive', 'eat-fit-digestive-175-g', '', 10000, '175 g', 9, 5, '', 'eat fit digestive biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p005', 'Eat Fit Sugarfree', 'eat-fit-sugarfree-250-g', '', 11000, '250 g', 4, 5, '', 'eat fit sugarfree biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "10 2 Box". Stored as 10.
  ('p006', 'Top Herbs', 'top-herbs-200-g', '', 10000, '200 g', 10, 5, '', 'top herbs biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW SP is Rs 330 and Sp per unit is Rs 30. Stock cell said "30 dozen". Stored as Rs 330, stock 30, unit 100 g.
  ('p007', 'Top Herbs', 'top-herbs-100-g', '', 33000, '100 g', 30, 5, '', 'top herbs biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p008', 'Good Day', 'good-day-200-g', '', 6000, '200 g', 2, 5, '', 'good day biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p009', 'Cheese Cracker', 'cheese-cracker-140-g', '', 7000, '140 g', 10, 5, '', 'cheese cracker biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p010', 'Cookies', 'cookies-150-g', '', 6000, '150 g', 3, 5, '', 'cookies biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p011', 'Ginger Honey', 'ginger-honey-150-g', '', 10000, '150 g', 60, 5, '', 'ginger honey biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p012', 'Top', 'top-200-g', '', 6000, '200 g', 17, 5, '', 'top biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "2 1 box". Stored as 2.
  ('p013', 'Coconut', 'coconut-200-g', '', 5000, '200 g', 2, 5, '', 'coconut biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p014', 'Coconut', 'coconut-1-dozen', '', 11000, '1 dozen', 1, 5, '', 'coconut biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "10 1 box". Stored as 10. Dozen price Rs 220, piece price on the sheet was Rs 20.
  ('p015', 'Bourbon', 'bourbon-1-dozen', '', 22000, '1 dozen', 10, 5, '', 'bourbon biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p016', 'Koseli Cookies', 'koseli-cookies-500-g', '', 19000, '500 g', 12, 5, '', 'koseli cookies biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p017', 'Time Pass 5050', 'time-pass-5050-150-g', '', 5000, '150 g', 13, 5, '', 'time pass 5050 biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p018', 'Time Pass 5050', 'time-pass-5050-1-dozen', '', 11000, '1 dozen', 1, 5, '', 'time pass 5050 biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p019', 'Happy Happy', 'happy-happy-1-dozen', '', 11000, '1 dozen', 3, 5, '', 'happy happy biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "10 2 pkt". Stored as 10. Dozen price Rs 110, piece price on the sheet was Rs 10.
  ('p020', 'Tiger', 'tiger-1-dozen', '', 11000, '1 dozen', 10, 5, '', 'tiger biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p021', 'Nutri Choice', 'nutri-choice-1-dozen', '', 22000, '1 dozen', 10, 5, '', 'nutri choice biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "10 4 box". Stored as 10.
  ('p022', 'Marie Gold', 'marie-gold-1-dozen', '', 11000, '1 dozen', 10, 5, '', 'marie gold biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p023', 'Marie Gold', 'marie-gold-250-g', '', 8000, '250 g', 9, 5, '', 'marie gold biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "10 5 box". Stored as 10.
  ('p024', 'Vita Milk', 'vita-milk-1-dozen', '', 10500, '1 dozen', 10, 5, '', 'vita milk biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p025', 'Bonbon', 'bonbon-1-dozen', '', 11000, '1 dozen', 1, 5, '', 'bonbon biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p026', 'Oreo', 'oreo-1-dozen', '', 27500, '1 dozen', 1, 5, '', 'oreo biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "20 1 box". Stored as 20. Sheet name was "Thin arot".
  ('p027', 'Thin Arrowroot', 'thin-arrowroot-1-dozen', '', 11000, '1 dozen', 20, 5, '', 'thin arrowroot biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW stock cell looked like "10 3 box". Stored as 10.
  ('p028', 'Monaco', 'monaco-1-dozen', '', 11000, '1 dozen', 10, 5, '', 'monaco biscuit dozen', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p029', 'Parle-G', 'parle-g-2-dozen', '', 22000, '2 dozen', 10, 5, '', 'parle g biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  ('p030', 'Hide and Seek', 'hide-and-seek-82-g', '', 5000, '82 g', 10, 5, '', 'hide and seek biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW pack price Rs 130. Sheet also showed Rs 25 per piece. Stored as Rs 130 for 6 pcs, stock 3.
  ('p031', 'Chocopie', 'chocopie-6-pcs', '', 13000, '6 pcs', 3, 5, '', 'chocopie biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),
  -- REVIEW pack price Rs 80. Sheet also showed Rs 5 per piece. Stored as Rs 80 for 8 pcs, stock 2.
  ('p032', 'Chocofun', 'chocofun-8-pcs', '', 8000, '8 pcs', 2, 5, '', 'chocofun biscuit', 1, 'cat_biscuits', NOW(3), NOW(3)),

  ('p033', 'Horlicks', 'horlicks-500-g', '', 43000, '500 g', 2, 5, '', 'horlicks health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p034', 'Viva', 'viva-500-g', '', 43000, '500 g', 1, 5, '', 'viva health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p035', 'Bournvita', 'bournvita-500-g', '', 56000, '500 g', 2, 5, '', 'bournvita health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p036', 'Horlicks', 'horlicks-1-kg', '', 84000, '1 kg', 4, 5, '', 'horlicks health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p037', 'Boost', 'boost-500-g', '', 43000, '500 g', 2, 5, '', 'boost health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p038', 'Women''s Horlicks', 'womens-horlicks-500-g', '', 56000, '500 g', 1, 5, '', 'womens horlicks health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p039', 'Sugar Free Horlicks', 'sugar-free-horlicks-500-g', '', 36000, '500 g', 4, 5, '', 'sugar free horlicks health drink', 1, 'cat_health', NOW(3), NOW(3)),
  ('p040', 'Chocolate Jam', 'chocolate-jam-340-g', '', 38000, '340 g', 12, 5, '', 'chocolate jam', 1, 'cat_health', NOW(3), NOW(3)),
  ('p041', 'Peanut Butter', 'peanut-butter-350-g', '', 30000, '350 g', 18, 5, '', 'peanut butter', 1, 'cat_health', NOW(3), NOW(3)),
  ('p042', 'Chyawanprash', 'chyawanprash-500-g', '', 36000, '500 g', 12, 5, '', 'chyawanprash chewanprash', 1, 'cat_health', NOW(3), NOW(3)),
  -- REVIEW second Chyawanprash row, same 500 g, price Rs 180. Stored as its own product.
  ('p043', 'Chyawanprash Value', 'chyawanprash-value-500-g', '', 18000, '500 g', 6, 5, '', 'chyawanprash chewanprash', 1, 'cat_health', NOW(3), NOW(3)),
  ('p044', 'Glucose', 'glucose-500-g', '', 13000, '500 g', 12, 5, '', 'glucose gulcose', 1, 'cat_health', NOW(3), NOW(3)),

  ('p045', 'Sai Kripa Chiya Patti', 'sai-kripa-chiya-patti-500-g', '', 30000, '500 g', 24, 5, '', 'sai kripa chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),
  ('p046', 'Samjhana Chiya Patti', 'samjhana-chiya-patti-500-g', '', 30000, '500 g', 50, 5, '', 'samjhana chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),
  ('p047', 'Tokla Chiya Patti', 'tokla-chiya-patti-500-g', '', 27500, '500 g', 16, 5, '', 'tokla chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),
  ('p048', 'Sai Kripa Chiya Patti', 'sai-kripa-chiya-patti-200-g', '', 14000, '200 g', 15, 5, '', 'sai kripa chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),
  ('p049', 'Sai Kripa Chiya Patti', 'sai-kripa-chiya-patti-50-g', '', 4000, '50 g', 60, 5, '', 'sai kripa chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),
  ('p050', 'Tokla Chiya Patti', 'tokla-chiya-patti-200-g', '', 12000, '200 g', 5, 5, '', 'tokla chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),
  ('p051', 'Tokla Green Tea', 'tokla-green-tea-100-g', '', 20500, '100 g', 11, 5, '', 'tokla green tea', 1, 'cat_tea', NOW(3), NOW(3)),
  -- REVIEW 100 g at Rs 600, while the 500 g pack is Rs 300. Stored as Rs 600.
  ('p052', 'Sai Kripa Chiya Patti', 'sai-kripa-chiya-patti-100-g', '', 60000, '100 g', 6, 5, '', 'sai kripa chiya patti tea', 1, 'cat_tea', NOW(3), NOW(3)),

  ('p053', 'Prawn', 'prawn-120-g', '', 3500, '120 g', 3, 5, '', 'prawn', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p054', 'Papad', 'papad-40-g', '', 4500, '40 g', 40, 5, '', 'papad', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p055', 'Food Colour', 'food-colour-100-g', '', 6000, '100 g', 12, 5, '', 'food colour', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p056', 'Yeast', 'yeast-80-g', '', 10000, '80 g', 6, 5, '', 'yeast', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p057', 'Ketchup', 'ketchup-200-g', '', 20000, '200 g', 1, 5, '', 'ketchup', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p058', 'Soya Sauce', 'soya-sauce-200-g', '', 7500, '200 g', 1, 5, '', 'soya sauce', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p059', 'Mustard Oil', 'mustard-oil-500-ml', '', 18000, '500 ml', 1, 5, '', 'mustard oil tel', 1, 'cat_kitchen', NOW(3), NOW(3)),
  -- REVIEW quantity cell was empty. Stored as unit "1 pc", price Rs 360, stock 1.
  ('p060', 'UL Oil', 'ul-oil-1-pc', '', 36000, '1 pc', 1, 5, '', 'ul oil', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p061', 'Hing', 'hing-16-g', '', 8000, '16 g', 16, 5, '', 'hing asafoetida', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p062', 'Honey', 'honey-100-g', '', 15000, '100 g', 6, 5, '', 'honey', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p063', 'Honey', 'honey-250-g', '', 25000, '250 g', 6, 5, '', 'honey', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p064', 'Honey', 'honey-500-g', '', 42000, '500 g', 9, 5, '', 'honey', 1, 'cat_kitchen', NOW(3), NOW(3)),
  ('p065', 'Till Oil', 'till-oil-500-ml', '', 18000, '500 ml', 14, 5, '', 'till oil sesame tel', 1, 'cat_kitchen', NOW(3), NOW(3)),

  ('p066', 'Khajurico Noodles', 'khajurico-noodles-600-g', '', 10000, '600 g', 2, 5, '', 'khajurico noodles', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p067', 'Veg Chowmein', 'veg-chowmein-350-g', '', 10000, '350 g', 16, 5, '', 'veg chowmein chowmin noodles', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p068', 'Current Kurkure', 'current-kurkure-75-g', '', 5000, '75 g', 1, 5, '', 'current kurkure', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p069', 'Kurkure', 'kurkure-75-g', '', 5000, '75 g', 7, 5, '', 'kurkure', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p070', 'Lays', 'lays-41-g', '', 5000, '41 g', 3, 5, '', 'lays chips', 1, 'cat_snacks', NOW(3), NOW(3)),
  -- REVIEW size cell was empty. Stored as unit "1 pack", price Rs 80, stock 2.
  ('p071', 'Lays', 'lays-1-pack', '', 8000, '1 pack', 2, 5, '', 'lays chips', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p072', 'Chitos', 'chitos-63-5-g', '', 5000, '63.5 g', 1, 5, '', 'chitos chips', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p073', 'Potato Chips', 'potato-chips-500-g', '', 20000, '500 g', 10, 5, '', 'potato chips', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p074', 'Potato Chips', 'potato-chips-120-g', '', 10000, '120 g', 5, 5, '', 'potato chips', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p075', 'Pringles', 'pringles-150-g', '', 29000, '150 g', 8, 5, '', 'pringles chips', 1, 'cat_snacks', NOW(3), NOW(3)),
  ('p076', 'Cheeseball', 'cheeseball-55-g', '', 5000, '55 g', 9, 5, '', 'cheeseball', 1, 'cat_snacks', NOW(3), NOW(3));

COMMIT;

SELECT COUNT(*) AS products FROM product;
SELECT name, unit, price, stock FROM product ORDER BY name, unit;
