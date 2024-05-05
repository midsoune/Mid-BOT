// ميزة عرض أخر أخبار موقع هيسبورت
import cheerio from 'cheerio';
import fetch from 'node-fetch';

const midsoune = async (m, { conn }) => {
  conn.hesport = conn.hesport ? conn.hesport : {};
  const res = await allhesport();
  const instructions = "📢 *رد على الرسالة برقم الخبر لعرضه كاملا*";
  const smCaps = '¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ¹⁰ ¹¹ ¹² ¹³ ¹⁴ ¹⁵ ¹⁶ ¹⁷ ¹⁸ ¹⁹ ²⁰';
  const smCapsArray = smCaps.split(' ');
  let teks = res.slice(0, 50).map((item, index) => {
    return `${smCapsArray[index]} ${item.title}`;
  }).join("\n\n");
  const { key } = await m.reply(`${teks}\n\n${instructions}`);
  conn.hesport[m.chat] = { list: res, key, timeout: setTimeout(() => { 
    delete conn.hesport[m.chat]; }, 250 * 1000)};
}

midsoune.before = async (m, { conn }) => {
  conn.hesport = conn.hesport ? conn.hesport : {};

  if (m.isBaileys || !(m.chat in conn.hesport)) return;
  const input = m.text.trim();
  if (!/^\d+$/.test(input)) return; 

  const { list, key } = conn.hesport[m.chat];
  const index = parseInt(input);

  const selectedNewsIndex = index - 1;
  if (selectedNewsIndex >= 0 && selectedNewsIndex < list.length) {
    const url = list[selectedNewsIndex].link;
    let item = await readhesport(url);
    let cap = `${item.content}`;
    const image = item.image;
    await conn.sendFile(m.chat, image, '', cap, m);

    clearTimeout(conn.hesport[m.chat].timeout);
    conn.hesport[m.chat].timeout = setTimeout(() => {
      delete conn.hesport[m.chat];
    }, 3 * 60 * 1000);
  }
}

async function allhesport() {
  try {
    const response = await fetch("https://www.hesport.com/all");
    const html = await response.text();

    const $ = cheerio.load(html);
    const result = [];

    $(".col-12.col-sm-6.col-md-6.col-xl-3").each((index, element) => {
      const card = {
        title: $(element).find(".card-title").text().trim(),
        date: $(element).find(".date-card small").text().trim(),
        image: $(element).find(".card-img-top img").attr("src"),
        link: $(element).find(".stretched-link").attr("href"),
      };
      result.push(card);
    });

    return result;
  } catch (error) {
    console.error("Error:", error);
  }
}
async function readhesport(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);
    $("script").remove();
    $("style").remove();
    const header = $(".article-header");
    const title = header.find(".post-title").text().trim();
    const image = $(".figure-heading-post .post-thumbnail img").attr("src");
    const content = $(".article-content").text().trim().replace(/\./g, ".\n\n");
    const article = {
      title,
      image,
      content,
    };
    return article;
  } catch (error) {
    console.error("Error:", error);
    throw 'الخبر ليس بمقال، جرب خبرًا آخر';
  }
}

midsoune.command = /^(hesport|هيسبورت)$/i;
export default midsoune;
