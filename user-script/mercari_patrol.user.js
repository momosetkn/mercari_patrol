// ==UserScript==
// @name         メルカリ通報！
// @namespace    https://github.com/momosetkn/
// @version      202109250055
// @description  メルカリ通報支援ツール
// @author       momosetkn
// @match        https://jp.mercari.com/*
// @icon         https://www.google.com/s2/favicons?domain=mercari.com
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @updateURL    https://momosetkn.github.io/mercari_patrol/user-script/mercari_patrol.user.js
// @downloadURL  https://momosetkn.github.io/mercari_patrol/user-script/mercari_patrol.user.js
// @homepage     https://github.com/momosetkn/mercari_patrol
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...
    // util
    const key = "merukari_tuho_tool"
    const reportKindKey = "merukari_tuho_tool_reportKindKey"
    const sleep = (sec) => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, sec);
        });
    };
    const zIndexSaikyo = "999999999";
    const createReportBtn = () => {
        const tuhoBtn = document.createElement("button")
        reportBtn.innerHTML = "🚨通報🚨"
        reportBtn.style.color = "red"
        reportBtn.style.fontSize = "32px"
        reportBtn.style.height = "48px"
        reportBtn.addEventListener('click', () => {
            document.querySelector("#item-info > section:nth-child(1) > section:nth-child(3) > div > mer-menu > mer-list > mer-action-row").shadowRoot.querySelector("div > button").click();
        });
        return reportBtn;
    }
    const createReportBtn_behind = (id) => {
        const reportBtn = document.createElement("button")
        reportBtn.innerHTML = "🚨通報🚨";
        reportBtn.style.color = "red";
        reportBtn.style.height = "48px";
        reportBtn.style.marginTop = "-50px";
        reportBtn.style.position = "relative";
        reportBtn.style.zIndex = zIndexSaikyo;
        reportBtn.style.cursor = "pointer";
        reportBtn.title = "別ウィンドウで開きます";
        reportBtn.addEventListener('click', () => {
            const url = `https://jp.mercari.com/report/item/${id}`;
            GM_openInTab(
                url, {insert: true}
            );
        });
        return reportBtn;
    }
    const createReportZumiLabel = () => {
        const elm = document.createElement("span")
        elm.innerHTML = "【👮通報済👮】"
        elm.style.color = "red"
        return elm;
    }
    const createReportZumiLabel_overlay = () => {
        const elm = document.createElement("span")
        elm.innerHTML = "【👮通報済👮】"
        elm.style.color = "red"
        elm.style.position = "absolute";
        elm.style.zIndex = zIndexSaikyo;
        return elm;
    }
    const save_report_kind_checkbox_id = "save_report_kind";
    const createReportKindCheckbox = () => {
        const elm = document.createElement("div")
        elm.innerHTML = `
          <input type="checkbox" id="${save_report_kind_checkbox_id}" name="save_report_kind" style="height: auto;">
          <label for="${save_report_kind_checkbox_id}">選択した報告理由を保存して、デフォルト値に設定する</label>
        `;
        return elm;
    }
    const saveReport = (id) => {
        const str = GM_getValue(key, "[]");
        const obj = JSON.parse(str);
        const newObj = [...obj.filter(x => x !== id), id];//重複排除
        GM_setValue(key, JSON.stringify(newObj));
    }
    const isReported = (id) => {
        const str = GM_getValue(key, "[]");
        const obj = JSON.parse(str);
        return obj.includes(id);
    }
    const saveReportKind = (id) => {
        GM_setValue(reportKindKey, id);
    }
    const getReportKind = () => {
        return GM_getValue(reportKindKey, "");
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
            // 選択した報告理由を保存するチェックボックス仕込み
            const mainElm = document.querySelector("main");
            mainElm.append(createReportKindCheckbox());

            const seleElm = document.querySelector("#main > form > mer-select > div > label > div.mer-select > select");
            const reportKind = getReportKind();
            if (reportKind) {
                seleElm.value = reportKind;
            }
            seleElm.dispatchEvent(new Event('change'));
            const pseudSeleElm = document.querySelector("#main > form > mer-select")
            pseudSeleElm.dispatchEvent(new Event('change'));

            //報告検知
            const submitBtn = document.querySelector("#main > form > mer-button > button");
            submitBtn.addEventListener('click', () => {
                saveReport(pathname.match(/\/report\/item\/(m\d+)/)[1]);
                if (document.getElementById(save_report_kind_checkbox_id).checked) {
                    saveReportKind(seleElm.value);
                }
            });
        }
        //商品詳細画面
        if (pathname.match(/^\/item\/m\d+/)) {
            // 通報ボタン追加
            while (true) {
                const dom = document.querySelector("#item-info > section:nth-child(1) > div.CheckoutButton__Container-sc-u05xmt-0.frFsns");
                if (dom) {
                    await sleep(50);
                    dom.prepend(createReportBtn());
                    break;
                }
                await sleep(100);
            }
            // 通報済みチェック
            while (true) {
                const titleElm = document.querySelector("#item-info > section:nth-child(1) > div.mer-spacing-b-12 > mer-heading")?.shadowRoot.querySelector("div > div.label-container > h1");
                if (titleElm) {
                    const id = pathname.match(/.*\/(m\d+)/)[1];
                    const reportedFlg = isReported(id);
                    if (reportedFlg) {
                        titleElm.prepend(createReportZumiLabel());
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
                                l.append(createReportBtn_behind(id));
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
                    if (anc) {
                        const id = anc[1];
                        const reportedFlg = isReported(id);
                        if (reportedFlg) {
                            l.prepend(createReportZumiLabel_overlay());
                        }
                    }
                });
                break;
            }
            await sleep(1000);
        }
    };

    (async () => {
        const getPath = () => window.location.toString().replace(/^https:\/\/jp\.mercari\.com/, "");
        let pathname = getPath();
        let prevPathname = null;
        while (true) {
            // SPAにおいてURLの変更を検知するいい方法が見当たらなかったので、ポーリング…
            pathname = getPath();
            if (pathname !== prevPathname) {
                await main(pathname);
            }

            prevPathname = pathname;
            await sleep(50);
        }
    })();

})();