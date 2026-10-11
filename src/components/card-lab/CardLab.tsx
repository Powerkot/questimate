import { useRef, useState, type CSSProperties } from "react";
import { HandEmbers } from "@/components/poker/HandEmbers";
import "./card-lab.css";

const values = ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"];
const labels = [
  "Очень маленькая",
  "Маленькая",
  "Средняя",
  "Большая",
  "Очень большая",
  "Гигантская",
  "Есть вопросы",
  "Перерыв",
];
const english = [
  "Extra small",
  "Small",
  "Medium",
  "Large",
  "Extra large",
  "Huge",
  "Unsure",
  "Break",
];
const fronts = [
  ["Запись в гримуаре", "Светлая страница, крупная каллиграфия и красная пометка на полях."],
  ["Ночная печать", "Тёмная поверхность и один тонкий магический круг вместо рамки."],
  ["Гильдейская эмаль", "Зелёная эмаль, кремовая лента и золотой герб."],
  ["Сталь кузнеца", "Матовый металл, угловой срез и четыре кованые заклёпки."],
  ["Кожа странника", "Мягкая коричневая кожа с прошитым краем и тиснением."],
  ["Окно собора", "Цветные стеклянные грани вокруг светлой надписи."],
  ["Записки алхимика", "Асимметричная лабораторная запись с чернильными схемами."],
  ["Слоновая кость", "Спокойная скульптурная карточка с выпуклой овальной медалью."],
  ["Лист поручения", "Оторванный лист с загнутым углом и большой оценкой сверху."],
  ["Багряный воск", "Оценка на рельефной восковой печати, без вложенных рамок."],
  ["Карта звёзд", "Синяя карта неба, координаты и оценка в открытом пространстве."],
  ["Чёрное золото", "Графит, строгая асимметрия и единственная золотая грань."],
  ["Лесной обет", "Бледный шалфей, тонкие ветви и мягкая органическая форма."],
  ["Дубовая дощечка", "Тёплое дерево с резной меткой и поперечным клеймом."],
  ["Печатный двор", "Контрастная типографика на белёной бумаге, без декоративной рамки."],
  ["Королевский бархат", "Фиолетовый бархат, подвешенный знак и нижняя золотая кисть."],
  ["Латунное солнце", "Светящийся солнечный диск на тёмной латуни."],
  ["Лунный портал", "Высокая арка, серебро и глубокий ночной синий."],
  ["Рунный камень", "Высеченный символ на прохладном сланце с неровным краем."],
  ["Драконья чешуя", "Тёмная чешуйчатая поверхность и огненная диагональная рассечка."],
];
const backs = [
  ["Роза ветров", "Тонкая навигационная звезда на ночном синем."],
  ["Гильдейский узел", "Переплетённые золотые петли на винной коже."],
  ["Лунный цикл", "Серебряные луны и спокойная симметрия."],
  ["Солнечный чекан", "Радиальный латунный медальон."],
  ["Сад фей", "Зеркальные растительные побеги на зелёном."],
  ["Витраж", "Геометрическая мозаика с медными перемычками."],
  ["Астролябия", "Орбиты, звёзды и наклонные кольца."],
  ["Плетёная лента", "Крупное переплетение тёплых и тёмных полос."],
  ["Драконово яйцо", "Чешуйки, обрамляющие маленькое янтарное ядро."],
  ["Печать таверны", "Абстрактный геральдический щит на дубовой дощечке."],
  ["Алхимическая решётка", "Светлая бумага, чернила и строгие треугольники."],
  ["Тихий обсидиан", "Чёрный камень и одна серебряная прорезь."],
  ["Звёздная ткань", "Мелкие звёзды и мягкая бархатная складка."],
  ["Морозный кристалл", "Ветвящаяся снежинка на ледяном серебре."],
  ["Портал", "Зеркальные светящиеся врата в глубокой темноте."],
];
const id = (prefix: string, index: number) => `${prefix}${String(index + 1).padStart(2, "0")}`;

/** Code-drawn ornaments: no image requests, no value-dependent back details. */
function Ornament({ kind, back = false }: { kind: number; back?: boolean }) {
  const star = "50,10 58,39 88,28 65,50 88,72 58,61 50,90 42,61 12,72 35,50 12,28 42,39";
  const motif = back
    ? kind
    : [10, 6, 9, 11, 1, 5, 10, 3, 11, 3, 6, 11, 4, 9, 10, 12, 3, 2, 13, 8][kind];
  return (
    <svg
      className="cl-ornament"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth=".8"
      aria-hidden="true"
    >
      {motif === 0 && (
        <>
          <circle cx="50" cy="50" r="37" />
          <polygon points={star} fill="currentColor" fillOpacity=".2" />
          <path d="M50 3v94M3 50h94" />
        </>
      )}
      {motif === 1 && (
        <>
          {[0, 45, 90, 135].map((a) => (
            <ellipse key={a} cx="50" cy="50" rx="14" ry="36" transform={`rotate(${a} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="7" />
        </>
      )}
      {motif === 2 && (
        <>
          <path
            d="M29 18a32 32 0 1 0 42 64A38 38 0 0 1 29 18Z"
            fill="currentColor"
            fillOpacity=".15"
          />
          <circle cx="66" cy="32" r="9" />
          <path d="m70 66 3 6-3 6-3-6Z" />
        </>
      )}
      {motif === 3 && (
        <>
          {Array.from({ length: 24 }, (_, i) => (
            <path key={i} d="M50 5v14" transform={`rotate(${i * 15} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="26" />
          <circle cx="50" cy="50" r="20" fill="currentColor" fillOpacity=".12" />
        </>
      )}
      {motif === 4 && (
        <>
          {[false, true].map((f) => (
            <g key={String(f)} transform={f ? "translate(100 100) rotate(180)" : ""}>
              <path d="M25 82Q58 54 37 14M38 31Q15 15 20 40Q32 48 38 31M42 48Q72 20 67 48Q54 63 42 48M37 65Q9 47 14 68Q22 82 37 65" />
              <circle cx="37" cy="14" r="2" fill="currentColor" />
            </g>
          ))}
        </>
      )}
      {motif === 5 && (
        <>
          <path d="m50 5 40 45-40 45L10 50Z" fill="currentColor" fillOpacity=".12" />
          <path d="M50 5v90M10 50h80M22 22l56 56M78 22 22 78" />
          <path d="M22 22h56v56H22Z" />
        </>
      )}
      {motif === 6 && (
        <>
          <circle cx="50" cy="50" r="34" />
          <ellipse cx="50" cy="50" rx="15" ry="43" transform="rotate(35 50 50)" />
          <ellipse cx="50" cy="50" rx="42" ry="13" transform="rotate(35 50 50)" />
          {[
            [20, 22],
            [76, 26],
            [69, 80],
            [27, 65],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="2" fill="currentColor" />
          ))}
        </>
      )}
      {motif === 7 && (
        <>
          {[15, 35, 55, 75].map((x) => (
            <g key={x}>
              <path d={`M${x} 5v90`} strokeWidth="9" />
              <path d={`M5 ${x}h90`} strokeWidth="4" />
            </g>
          ))}
        </>
      )}
      {motif === 8 && (
        <>
          {[0, 1, 2, 3].map((y) =>
            [0, 1, 2].map((x) => (
              <path
                key={`${x}-${y}`}
                d="M0 0Q12 27 24 0"
                transform={`translate(${14 + x * 24 - (y % 2) * 12} ${12 + y * 21})`}
              />
            )),
          )}
          <path d="m50 39 8 11-8 11-8-11Z" fill="currentColor" />
        </>
      )}
      {motif === 9 && (
        <>
          <path d="M24 16h52v37Q76 76 50 87Q24 76 24 53Z" fill="currentColor" fillOpacity=".12" />
          <path d="M32 27h36M50 27v43M35 52l15 18 15-18" />
          <circle cx="50" cy="19" r="3" />
        </>
      )}
      {motif === 10 && (
        <>
          <path d="m50 10 36 66H14Zm0 80L14 24h72Z" />
          <circle cx="50" cy="50" r="33" />
          <path d="M43 50h14M50 43v14" />
          <circle cx="50" cy="50" r="6" />
        </>
      )}
      {motif === 11 && (
        <>
          <path d="m29 8 42 84M30 8h17M53 92h17" strokeWidth="2" />
          <path d="m39 18 22 64" strokeWidth=".4" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
        </>
      )}
      {motif === 12 && (
        <>
          {[
            [20, 20],
            [75, 23],
            [50, 48],
            [20, 77],
            [76, 79],
            [46, 9],
            [9, 45],
            [91, 53],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x - 4} ${y}h8M${x} ${y - 4}v8`} />
          ))}
          <path d="M10 98Q70 50 90 2" strokeWidth=".4" />
        </>
      )}
      {motif === 13 && (
        <>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path
              key={a}
              d="M50 50V8M50 22 38 12M50 22l12-10M50 36 32 24M50 36l18-12"
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="6" />
        </>
      )}
      {motif === 14 && (
        <>
          {[0, 180].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50)`}>
              <path d="M22 48V28a28 28 0 0 1 56 0v20M29 48V28a21 21 0 0 1 42 0v20M36 48V28a14 14 0 0 1 28 0v20" />
              <path d="M22 48h56" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

function Card({
  front,
  back,
  value = "M",
  lang,
  flipped = false,
  selected = false,
}: {
  front: number;
  back: number;
  value?: string;
  lang: boolean;
  flipped?: boolean;
  selected?: boolean;
}) {
  const index = values.indexOf(value);
  return (
    <span
      className={`cl-card cl-length-${value.length} cl-f${front + 1} cl-b${back + 1}${flipped ? " cl-flipped" : ""}${selected ? " cl-selected" : ""}`}
    >
      <span className="cl-flipper">
        <span className="cl-face cl-front">
          <span className="cl-surface" />
          <span className="cl-corner" aria-hidden="true">
            {value}
          </span>
          <Ornament kind={front} />
          <span className="cl-value">{value}</span>
          <span className="cl-label">{(lang ? english : labels)[index]}</span>
          <span className="cl-foot" aria-hidden="true">
            QUESTIMATE
          </span>
        </span>
        <span className="cl-face cl-back">
          <span className="cl-surface" />
          <Ornament kind={back} back />
          <span className="cl-back-dots" aria-hidden="true">
            ✦ · ✦
          </span>
        </span>
      </span>
    </span>
  );
}

export function CardLab() {
  const preview = useRef<HTMLElement>(null);
  const [front, setFront] = useState(0);
  const [back, setBack] = useState(0);
  const [tab, setTab] = useState<"front" | "back">("front");
  const [lang, setLang] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState("M");
  const [motion, setMotion] = useState(true);
  return (
    <main className={`cl-lab${motion ? "" : " cl-still"}`}>
      <header className="cl-header">
        <a href="/" className="cl-brand">
          Q<span>UESTIMATE</span>
        </a>
        <span>
          Мастерская карт <b> / 01</b>
        </span>
        <a href="/">Вернуться в таверну ↗</a>
      </header>
      <div className="cl-intro">
        <span className="cl-eyebrow">20 лицевых сторон · 15 рубашек · только код</span>
        <h1>Мастерская карт</h1>
        <p>
          <a href="/quest-decks">Смотреть 9 выбранных дизайнов с изображения →</a>
        </p>
        <p>
          Выбирайте поверхность и рубашку независимо. Все варианты ниже — настоящие карточки: их
          можно перевернуть, выбрать и проверить в колоде.
        </p>
      </div>
      <section
        ref={preview}
        id="card-preview"
        className="cl-workbench"
        aria-label="Предпросмотр выбранного дизайна"
      >
        <div className="cl-controls">
          <label>
            Лицевая сторона
            <select value={front} onChange={(e) => setFront(Number(e.target.value))}>
              {fronts.map(([name], i) => (
                <option key={i} value={i}>
                  {id("F", i)} · {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Рубашка
            <select value={back} onChange={(e) => setBack(Number(e.target.value))}>
              {backs.map(([name], i) => (
                <option key={i} value={i}>
                  {id("B", i)} · {name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setLang(!lang)}>
            {lang ? "EN → RU" : "RU → EN"}
          </button>
          <button type="button" aria-pressed={motion} onClick={() => setMotion(!motion)}>
            Анимация {motion ? "вкл" : "выкл"}
          </button>
          <a className="cl-jump" href="#card-collection">
            К коллекции ↓
          </a>
        </div>
        <div className="cl-preview">
          <div className="cl-large">
            <button
              className="cl-flip-button"
              onClick={() => setFlipped(!flipped)}
              aria-label="Перевернуть большую карту"
            >
              <Card front={front} back={back} value={picked} lang={lang} flipped={flipped} />
            </button>
            <button className="cl-text-button" onClick={() => setFlipped(!flipped)}>
              Перевернуть ↻
            </button>
          </div>
          <div className="cl-preview-copy">
            <span className="cl-eyebrow">
              {id("F", front)} + {id("B", back)}
            </span>
            <h2>{fronts[front][0]}</h2>
            <p>{fronts[front][1]}</p>
            <div className="cl-rule" />
            <h3>На столе</h3>
            <p className="cl-muted">Реальный небольшой размер, лицо и рубашка</p>
            <div className="cl-table-samples">
              <Card front={front} back={back} value={picked} lang={lang} />
              <Card front={front} back={back} lang={lang} flipped />
              <Card front={front} back={back} value="XXL" lang={lang} />
            </div>
            <p className="cl-current">
              Выбрана оценка <b>{picked}</b> · рубашка «{backs[back][0]}»
            </p>
          </div>
        </div>
        <div className="cl-hand-section">
          <div className="cl-hand-title">
            <span>Ваша рука</span>
            <small>Наведите курсор или выберите оценку</small>
          </div>
          <div className="cl-hand-stage">
            {motion && <HandEmbers />}
            <div className="cl-hand">
              {values.map((value, i) => (
                <div
                  key={value}
                  className={`cl-hand-slot${picked === value ? " cl-picked" : ""}`}
                  style={
                    {
                      "--r": `${(i - 3.5) * 4.6}deg`,
                      "--y": `${(i - 3.5) ** 2 * 2.3}px`,
                    } as CSSProperties
                  }
                >
                  <button
                    aria-label={`Выбрать ${value}`}
                    aria-pressed={picked === value}
                    onClick={() => setPicked(value)}
                  >
                    <Card
                      front={front}
                      back={back}
                      value={value}
                      lang={lang}
                      selected={picked === value}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <p className="cl-mobile-note">
            На самых маленьких картах подпись скрыта: оценка остаётся главным ориентиром.
          </p>
        </div>
      </section>
      <section id="card-collection" className="cl-collection" aria-label="Коллекция дизайнов">
        <div className="cl-collection-heading">
          <div>
            <span className="cl-eyebrow">Выберите свой характер</span>
            <h2>{tab === "front" ? "Лицевые стороны" : "Рубашки"}</h2>
          </div>
          <div className="cl-tabs">
            <button aria-pressed={tab === "front"} onClick={() => setTab("front")}>
              20 лицевых
            </button>
            <button aria-pressed={tab === "back"} onClick={() => setTab("back")}>
              15 рубашек
            </button>
          </div>
        </div>
        <div className="cl-grid">
          {(tab === "front" ? fronts : backs).map(([name, description], i) => {
            const active = (tab === "front" ? front : back) === i;
            return (
              <button
                key={`${tab}-${i}`}
                className={`cl-tile${active ? " cl-active" : ""}`}
                aria-pressed={active}
                aria-label={`${id(tab === "front" ? "F" : "B", i)} ${name}`}
                onClick={() => {
                  if (tab === "front") {
                    setFront(i);
                    setFlipped(false);
                  } else {
                    setBack(i);
                    setFlipped(true);
                  }
                  preview.current?.scrollIntoView({
                    behavior:
                      motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
                        ? "smooth"
                        : "auto",
                    block: "start",
                  });
                }}
              >
                <span className="cl-tile-top">
                  <b>{id(tab === "front" ? "F" : "B", i)}</b>
                  <span>{active ? "ВЫБРАНО" : "ПОСМОТРЕТЬ ↗"}</span>
                </span>
                <span className="cl-tile-art">
                  <Card
                    front={tab === "front" ? i : front}
                    back={tab === "back" ? i : back}
                    lang={lang}
                    flipped={tab === "back"}
                  />
                </span>
                <strong>{name}</strong>
                <span className="cl-tile-description">{description}</span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className="cl-footer">
        <span>QUESTIMATE / CARD ATELIER</span>
        <p>
          Назовите пару, например <b>F12 + B04</b>. Выбор здесь не меняет карты на основном сайте.
        </p>
      </footer>
    </main>
  );
}
