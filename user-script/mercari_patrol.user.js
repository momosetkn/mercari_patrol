// ==UserScript==
// @name         メルカリ通報！
// @namespace    https://github.com/momosetkn/
// @version      0.1
// @description  メルカリ通報支援ツール
// @author       momosetkn
// @match        https://jp.mercari.com/*
// @icon         https://www.google.com/s2/favicons?domain=mercari.com
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @updateURL    https://momosetkn.github.io/mercari_patrol/public/user-script/mercari_patrol.user.js
// @downloadURL  https://momosetkn.github.io/mercari_patrol/public/user-script/mercari_patrol.user.js
// @homepage     https://github.com/momosetkn/mercari_patrol
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...
    // util
    const key = "merukari_tuho_tool"
    const sleep = (sec) => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, sec);
        });
    };
    const zIndexSaikyo = "999999999";
    const createTuhoBtn = () => {
        const tuhoBtn = document.createElement("button")
        tuhoBtn.innerHTML = "🚨通報🚨"
        tuhoBtn.style.color = "red"
        tuhoBtn.style.fontSize = "32px"
        tuhoBtn.style.height = "48px"
        tuhoBtn.addEventListener('click', () => {
            location.href = "/report" + window.location.pathname;
        });
        return tuhoBtn;
    }
    const createTuhoBtn_behind = (id) => {
        const tuhoBtn = document.createElement("button")
        tuhoBtn.innerHTML = "🚨通報🚨";
        tuhoBtn.style.color = "red";
        tuhoBtn.style.height = "48px";
        tuhoBtn.style.marginTop = "-50px";
        tuhoBtn.style.position = "relative";
        tuhoBtn.style.zIndex = zIndexSaikyo;
        tuhoBtn.style.cursor = "pointer";
        tuhoBtn.title = "別ウィンドウで開きます";
        tuhoBtn.addEventListener('click', () => {
            const url = `https://jp.mercari.com/report/item/${id}`;
            GM_openInTab(
                url, {insert: true}
            );
        });
        return tuhoBtn;
    }
    const createTuhoZumiLabel = () => {
        const elm = document.createElement("span")
        elm.innerHTML = "【👮通報済👮】"
        elm.style.color = "red"
        return elm;
    }
    const createTuhoZumiLabel_overlay = () => {
        const elm = document.createElement("span")
        elm.innerHTML = "【👮通報済👮】"
        elm.style.color = "red"
        elm.style.position = "absolute";
        elm.style.zIndex = zIndexSaikyo;
        return elm;
    }
    const saveTuho = (id) => {
        const str = GM_getValue(key, "[]");
        const obj = JSON.parse(str);
        const newObj = [...obj.filter(x => x !== id), id];//重複排除
        GM_setValue(key, JSON.stringify(newObj));
    }
    const isTuhoZumi = (id) => {
        const str = GM_getValue(key, "[]");
        const obj = JSON.parse(str);
        return obj.includes(id);
    }

    //main
    const main = async (pathname) => {
        // 報告画面
        if (pathname.match(/^\/report\/item\/m\d+/)) {
            // モーダルのOKを押す
            while (true) {
                const btn = document.querySelector("body > mer-dialog > div:nth-child(2) > mer-button > button");
                if (btn) {
                    await sleep(30);//なんか消えなかったのでスリープ
                    btn.click();
                    break;
                }
                await sleep(100);
            }
            const seleElm = document.querySelector("#main > form > mer-select > div > label > div.mer-select > select");
            seleElm.value = "1002";
            seleElm.dispatchEvent(new Event('change'));
            const pseudSeleElm = document.querySelector("#main > form > mer-select")
            pseudSeleElm.dispatchEvent(new Event('change'));

            //報告検知
            const submitBtn = document.querySelector("#main > form > mer-button > button");
            submitBtn.addEventListener('click', () => {
                saveTuho(pathname.match(/\/report\/item\/(m\d+)/)[1]);
            });
        }
        //商品詳細画面
        if (pathname.match(/^\/item\/m\d+/)) {
            // 通報ボタン追加
            while (true) {
                const dom = document.querySelector("#item-info > section:nth-child(1) > div.CheckoutButton__Container-sc-u05xmt-0.frFsns");
                if (dom) {
                    await sleep(50);
                    dom.prepend(createTuhoBtn());
                    break;
                }
                await sleep(100);
            }
            // 通報済みチェック
            while (true) {
                const titleElm = document.querySelector("#item-info > section:nth-child(1) > div.mer-spacing-b-12 > mer-heading")?.shadowRoot.querySelector("div > div.label-container > h1");
                if (titleElm) {
                    const id = pathname.match(/.*\/(m\d+)/)[1];
                    const tuhozumiFlg = isTuhoZumi(id);
                    if (tuhozumiFlg) {
                        titleElm.prepend(createTuhoZumiLabel());
                    }
                    break;
                }
                await sleep(100);
            }

        }
        //プロフィール画面
        if (pathname.match(/^\/user\/profile\/\d+/)) {
            // 一括通報
            while (true) {
                let lists_ = document.querySelectorAll("#main > div > section.no-border > section > ul > li")
                if (lists_.length) {
                    await sleep(500);
                    lists_ = document.querySelectorAll("#main > div > section.no-border > section > ul > li")
                    const lists = Array.from(lists_);
                    lists.map(async l => {
                        while (true) {
                            const anc = l.querySelector('a');
                            if (anc) {
                                const id = anc.href.match(/.*\/(m\d+)/)[1];
                                l.append(createTuhoBtn_behind(id));
                                break;
                            }
                            await sleep(100);
                        }
                    });
                    break;
                }
                await sleep(100);
            }
        }
        //どの画面に商品へのリンクが出てくるか分からないので…全ページ対象
        while (true) {
            let items_ = document.querySelectorAll("a[href^='/item/']");
            if (items_.length) {
                // 読み込まれないことがある？ので、再度読み込み
                await sleep(200);
                items_ = document.querySelectorAll("a[href^='/item/']");

                const items = Array.from(items_);
                items.map(l => {
                    const anc = l.href.match(/\/item\/(m\d+)/);
                    console.log(anc);
                    if (anc) {
                        const id = anc[1];
                        const tuhozumiFlg = isTuhoZumi(id);
                        if (tuhozumiFlg) {
                            l.prepend(createTuhoZumiLabel_overlay());
                        }
                    }
                });
                break;
            }
            await sleep(1000);
        }
    };

    // URLごとに処理済みかチェックするため
    const memoDiv = document.createElement("div");
    memoDiv.style.display = "none";
    memoDiv.innerText = "[]";
    document.body.append(memoDiv);

    (async () => {
        const getPath = () => window.location.toString().replace(/^https:\/\/jp\.mercari\.com/, "");
        let pathname = getPath();
        let prevPathname = null;
        while (true) {
            // SPAにおいてURLの変更を検知するいい方法が見当たらなかったので、ポーリング…
            pathname = getPath();
            if (pathname !== prevPathname) {
                const syorizumiList = JSON.parse(memoDiv.innerText);
                if (!syorizumiList.includes(pathname)) {
                    await main(pathname);
                    memoDiv.innerText = JSON.stringify([...syorizumiList, pathname]);
                }
            }

            prevPathname = pathname;
            await sleep(50);
        }
    })();

})();