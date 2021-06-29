//
// Amazon Prime Video のグリッドビュー(一覧)で表示される
// タイトルから1個ずつレビュー情報を吸い取っり、まとめ
// 情報をJSON方式でコンソールで吐き出す
//
(async function(){
    const SLEEP_BETWEEN_SCANS = 200;
    const SLEEP_BEFORE_LOADING_REVIEWS = 200;

    // the followings are susceptible to widget updates
    const STARS_VIEW_SELECTOR = '.D9LaaU._2P6ICV';
    const STARS_VIEW_CLASSES = {
        '._1UiYYY' : 1,
        '._29ls17' : 0.5,
        '._2tKs5V' : 0,
    };

    function timerStart() {
        return {start: new Date()};
    }

    function timerGetElapsed(timer) {
        const {start} = timer;
        const end = new Date();
        const diff = end - start;
        return diff;
    }

    function sleepAsync(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    function getLinks() {
        return document.querySelectorAll('.av-grid-packshot > a')
    }

    function scrollIntoView(a) {
        a.closest('.dvui-beardContainer').scrollIntoView();
    }

    /**
     * 窓(タブ)を開く
     * @param {string} url
     * @return {Promise<Window>}
     */
    function openNewPageAsync(url) {
        return new Promise(resolve => {
            let win = window.open(url, '_blank');
            win.onload = function () {
                resolve(win);
            }
        });
    }

    /**
     * レビュー情報を開いた窓から取得する
     * @param {Window} win
     * @return {Promise<{stars:number,count:number}>}
     */
    function loadReviewsAsync(win) {
        return new Promise(async resolve => {
            const doc = win.document;
            const section = doc.querySelector('*[data-automation-id="customer-review-section"]');
            if (section) {
                let reviewCount = -1;
                // レビュー数を取得
                const badge = doc.querySelector('*[data-automation-id="customer-review-badge"]');
                badge.click();
                await sleepAsync(SLEEP_BEFORE_LOADING_REVIEWS);
                const matched = badge.innerText.match(/\(([0-9\,]+)\)/);
                if (matched) {
                    reviewCount = parseInt(matched[1].replace(/\,/g, ''));
                }

                // ☆☆ ウィジェットから星数を取得
                const starsView = section.querySelector(STARS_VIEW_SELECTOR);
                let starCount = 0;
                for (const [selector, score] of Object.entries(STARS_VIEW_CLASSES)) {
                    let howMany = starsView.querySelectorAll(selector).length;
                    starCount += howMany * score;
                }

                // return metadata
                return resolve({stars:starCount, count:reviewCount});
            }
            else {
                console.warn('no customer review section found');
                resolve({});
            }
        });
    }

    // 
    // main
    //
    //
    let ratingList = {};
    let prevLinkCount = 0;

    while (true) {
        let links = getLinks();
        let linkCount = links.length;
        if (linkCount === prevLinkCount) {
            console.log('no more links');
            break;
        }

        const globalTimer = timerStart();
        let doneCount = 0;

        for (let i = prevLinkCount; i < linkCount; i++) {
            const timer = timerStart();

            let link = links[i];
            let title = link.getAttribute('aria-label');
            if (title in ratingList) {
                continue;
            }
            scrollIntoView(link);
            const win = await openNewPageAsync(link.href);

            let infoDict = await loadReviewsAsync(win);
            console.log(title, infoDict, link.href);
            ratingList[title] = infoDict;

            win.close();

            // endless scrolling
            await sleepAsync(SLEEP_BETWEEN_SCANS);

            // 進捗と残り時間表示
            doneCount++;
            if (i % 5 === 0) {
                const timeTaken = timerGetElapsed(globalTimer);
                const timeLeft = (timeTaken / doneCount) * (linkCount - i) / 1000;
                console.log(Math.round(100 * i / linkCount), '% done; time left (sec)', Math.round(timeLeft));
            }
        }

        prevLinkCount = linkCount;
    } 
    console.log(JSON.stringify(ratingList,"",2));

})();

