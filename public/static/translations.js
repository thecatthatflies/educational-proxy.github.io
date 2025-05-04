const translations = {
    en: {
        meta: {
            description: "Access educational content and learning resources with 1346.lol - Your comprehensive education platform. Explore interactive learning tools, educational games, and academic resources. School-friendly environment with no registration required.",
            title: "1346.lol - Educational Resources & Learning Platform"
        },
        loader: {
            line1: "Loading educational platform...",
            line2: "Initializing learning resources...",
            line3: "Establishing secure connection..."
        },
        search: {
            placeholder: "Search DuckDuckGo or type a URL"
        },
        buttons: {
            execute: "Execute",
            games: "Games",
            apps: "Apps",
            cloaker: "Cloaker",
            discord: "Join Discord"
        },
        footer: {
            privacy: "Use constitutes acceptance of our",
            privacyLink: "privacy policy"
        }
    },
    ja: {
        meta: {
            description: "1346.lol で教育コンテンツと学習リソースにアクセス。インタラクティブな学習ツール、教育ゲーム、学術リソースを探索できます。登録不要の学校向け環境を提供しています。",
            title: "1346.lol - 教育リソース＆学習プラットフォーム"
        },
        loader: {
            line1: "教育プラットフォームを読み込んでいます...",
            line2: "学習リソースを初期化しています...",
            line3: "安全な接続を確立しています..."
        },
        search: {
            placeholder: "DuckDuckGo で検索するか URL を入力"
        },
        buttons: {
            execute: "実行",
            games: "ゲーム",
            apps: "アプリ",
            cloaker: "クローカー",
            discord: "Discord に参加"
        },
        footer: {
            privacy: "利用することで当サイトの",
            privacyLink: "プライバシーポリシー"
        }
    }
};

// Language management
function getPreferredLanguage() {
    // Check localStorage first
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang === 'ja' || storedLang === 'en') return storedLang;
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam === 'ja' || langParam === 'en') return langParam;
    
    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('ja') ? 'ja' : 'en';
}

function switchLanguage(lang) {
    if (lang !== 'en' && lang !== 'ja') return;
    
    // Store the preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Update content
    updatePageContent(lang);
    
    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeButton = document.querySelector(`.lang-btn[onclick*="'${lang}'"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function updatePageContent(lang) {
    const t = translations[lang];
    
    // Update meta tags
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]').content = t.meta.description;
    document.querySelector('meta[property="og:title"]').content = t.meta.title;
    document.querySelector('meta[property="og:description"]').content = t.meta.description;
    document.querySelector('meta[name="twitter:title"]').content = t.meta.title;
    document.querySelector('meta[name="twitter:description"]').content = t.meta.description;
    
    // Update loader text
    document.querySelectorAll('.loader-line')[0].textContent = t.loader.line1;
    document.querySelectorAll('.loader-line')[1].textContent = t.loader.line2;
    document.querySelectorAll('.loader-line')[2].textContent = t.loader.line3;
    
    // Update search placeholder
    document.getElementById('uv-address').placeholder = t.search.placeholder;
    
    // Update buttons
    document.querySelector('button[type="submit"]').textContent = t.buttons.execute;
    document.querySelector('button[onclick*="gxmes"]').textContent = t.buttons.games;
    document.querySelector('button[onclick*="apps"]').textContent = t.buttons.apps;
    document.querySelector('button[onclick*="createCloakedPage"]').textContent = t.buttons.cloaker;
    document.querySelector('button[onclick*="discord"]').textContent = t.buttons.discord;
    
    // Update footer
    const privacyText = document.querySelector('footer div');
    privacyText.innerHTML = `${t.footer.privacy} <a href="privacy.html" style="color: #00ff00; text-decoration: none; border-bottom: 1px solid #00ff00;">${t.footer.privacyLink}</a>`;
    
    // Update html lang attribute
    document.documentElement.lang = lang;
}