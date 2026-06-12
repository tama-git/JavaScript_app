class Pref_capital_location_Quiz {
    // クイズ全体の初期設定を行う
    constructor(rootElm) {
        this.rootElm = rootElm;
        //ゲームのステータス
        this.gameStatus = {};
        this.resetGame();
    }

    // JSONを読み込んで開始画面を表示する
    async init() {
        await this.fetchQuizData();
        this.displayStartView();
    }

    // AJAXでjsonを読み込む
    async fetchQuizData() {
        try {
            const response = await fetch("pref.json");
            this.quizData = await response.json();
        } catch (e) {
            this.rootElm.innerText = "問題の読み込みに失敗しました";
            console.log(e);
        }

    }

    // 問題を並び替える
    shuffleArray() {
        const currentQuestions = this.quizData[this.gameStatus.area];
        const questionOrder = Object.keys(currentQuestions);

        for (let i = questionOrder.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = questionOrder[i];
            questionOrder[i] = questionOrder[randomIndex];
            questionOrder[randomIndex] = temp;
        }

        this.gameStatus.questionOrder = questionOrder;
    }

    // 選択肢をランダムに並び替える
    shuffleChoices(choices) {
        const shuffledChoices = [];

        for (let i = 0; i < choices.length; i++) {
            shuffledChoices.push(choices[i]);
        }

        for (let i = shuffledChoices.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = shuffledChoices[i];
            shuffledChoices[i] = shuffledChoices[randomIndex];
            shuffledChoices[randomIndex] = temp;
        }

        return shuffledChoices;
    }

    // 現在の問題が最後の問題か判定する
    isLastStep() {
        return this.gameStatus.step === this.gameStatus.questionOrder.length;
    }

    // 回答を記録し、次の問題または結果画面へ進める
    nextStep() {
        this.clearTimer();
        this.addResult();
        if (this.isLastStep()) {
            this.displayResultView()
        } else {
            this.gameStatus.step++;
            this.displayQuestionView();
        }
    }

    // 選択した答えを回答結果として保存する
    addResult() {
        const checkedElm = this.rootElm.querySelector('input[name="choice"]:checked');
        const answer = checkedElm ? checkedElm.value : "";
        const questionKey = this.gameStatus.questionOrder[this.gameStatus.step - 1];
        const currentQuestion = this.quizData[this.gameStatus.area][questionKey];
        this.gameStatus.results.push({
            question: currentQuestion,
            selectedAnswer: answer
        });
        console.log(`回答結果 : ${answer}`)
    }


    // 正解した問題数を数える
    countCorrectAnswers() {
        let correctNum = 0;
        const results = this.gameStatus.results;

        for (const result of results) {
            const selected = result.selectedAnswer;
            const correct = result.question.answer;

            if (selected === correct) {
                correctNum++;
            }
        }
        return correctNum;
    }

    // 正解率を計算する
    calcScore() {
        const correctNum = this.countCorrectAnswers();
        const results = this.gameStatus.results;

        return Math.floor((correctNum / results.length) * 100);
    }

    // 正解数に応じて結果メッセージを返す
    scoreMessage() {
        const correctNum = this.countCorrectAnswers();
        const total = this.gameStatus.results.length;

        if (correctNum === total) {
            return "Flawless!";
        } else if (correctNum >= total - 1) {
            return "Outstanding!";
        } else if (correctNum >= total - 2) {
            return "Great job!";
        } else if (correctNum >= Math.floor(total / 2)) {
            return "Good effort!";
        } else if (correctNum >= 1) {
            return "Back to basics.";
        } else {
            return "Time to reset.";
        }
    }

    // ゲームの状態を初期状態に戻す
    resetGame() {
        this.gameStatus.area = null;
        this.gameStatus.step = 1;
        this.gameStatus.results = [];
        this.gameStatus.timeLimit = 0;
        this.gameStatus.intervalKey = null;
        this.gameStatus.questionOrder = [];
    }

    // 1問ごとの制限時間を設定する
    setTimer() {
        if (this.gameStatus.intervalKey !== null) {
            throw new Error("まだタイマーが動いています");
        }
        this.gameStatus.timeLimit = 15;
        this.gameStatus.intervalKey = setInterval(() => {
            this.gameStatus.timeLimit--;
            if (this.gameStatus.timeLimit === 0) {
                this.nextStep();
            } else {
                this.renderTimeLimitStr();
            }
        }, 1000);
    }

    // 動いているタイマーを止める
    clearTimer() {
        clearInterval(this.gameStatus.intervalKey);
        this.gameStatus.intervalKey = null;
    }

    // 地方を選ぶ開始画面を表示する
    displayStartView() {
        const areaStrs = Object.keys(this.quizData);
        this.gameStatus.area = areaStrs[0];
        const optionStrs = [];
        for (let i = 0; areaStrs.length > i; i++) {
            optionStrs.push(`<option value="${areaStrs[i]}" name="area">${areaStrs[i]}</option>`);
        }
        const html = `
                    <select class="areaSelector">
                        ${optionStrs.join("")}
                    </select>
                    <button class="startBtn">スタート</button>
                `;
        const parentElm = document.createElement("div");
        parentElm.className = "start";
        parentElm.innerHTML = html;

        const selectorElm = parentElm.querySelector(".areaSelector");
        selectorElm.addEventListener("change", (event) => {
            this.gameStatus.area = event.target.value;
        });

        const startBtnElm = parentElm.querySelector(".startBtn");
        startBtnElm.addEventListener("click", () => {
            this.gameStatus.step = 1;
            this.gameStatus.results = [];
            this.shuffleArray();
            this.displayQuestionView();
        });
        this.replaceView(parentElm);
    }

    // 現在の問題と選択肢を表示する
    displayQuestionView() {

        console.log(`選択中の都道府県:${this.gameStatus.area}`);
        this.setTimer()
        const stepKey = this.gameStatus.questionOrder[this.gameStatus.step - 1];

        const currentQuestion = this.quizData[this.gameStatus.area][stepKey]

        const choiceStrs = [];
        const shuffledChoices = this.shuffleChoices(currentQuestion.choices);
        for (const choice of shuffledChoices) {
            choiceStrs.push(`
                <label>
                    <input type="radio" name="choice" value="${choice}"/>
                    ${choice}
                </label>
                `);
        }
        const html = `
        <p>${currentQuestion.pref}</p>
        <div>
            ${choiceStrs.join("")}
        </div>
        <p class="judgeMessage"></p>
        <p class="sec">残り回答時間:${this.gameStatus.timeLimit}秒</p>
        `;
        const parentElm = document.createElement("div");
        parentElm.className = "question";
        parentElm.innerHTML = html;

        let answered = false;
        const choiceInputElms = parentElm.querySelectorAll('input[name="choice"]');
        const judgeMessageElm = parentElm.querySelector(".judgeMessage");

        for (const choiceInputElm of choiceInputElms) {
            choiceInputElm.addEventListener("change", () => {
                if (answered) {
                    return;
                }

                answered = true;
                this.clearTimer();

                const selectedAnswer = choiceInputElm.value;
                const isCorrect = selectedAnswer === currentQuestion.answer;

                for (const inputElm of choiceInputElms) {
                    inputElm.disabled = true;

                    if (inputElm.value === currentQuestion.answer) {
                        inputElm.parentElement.className = "correctChoice";
                    } else if (inputElm.checked) {
                        inputElm.parentElement.className = "wrongChoice";
                    }
                }

                //選択時の正誤
                
                if (isCorrect) {
                    judgeMessageElm.innerText = "正解！";
                    judgeMessageElm.className = "judgeMessage correctMessage";
                } else {
                    judgeMessageElm.innerText = `不正解 正解は「${currentQuestion.answer}」です`;
                    judgeMessageElm.className = "judgeMessage wrongMessage";
                }

                setTimeout(() => {
                    this.nextStep();
                }, 800);
            });
        }

        this.replaceView(parentElm);
    }

    // 残り時間の表示を更新する
    renderTimeLimitStr() {
        const secElm = this.rootElm.querySelector(".sec");
        secElm.innerText = `残り回答時間:${this.gameStatus.timeLimit}秒`;
    }

    // 結果画面を表示する
    displayResultView() {
        const score = this.calcScore();
        const correctNum = this.countCorrectAnswers();
        const total = this.gameStatus.results.length;
        const resultMessage = this.scoreMessage();
        const html = `
        <p>ゲーム終了</p>
        <p class="resultMessage">${resultMessage}</p>
        <p class="scoreText">正解数：${correctNum} / ${total}</p>
        <p class="scoreText">正答率：${score}%</p>
        <button class="resetBtn">開始画面に戻る</button>
        `;
        const parentElm = document.createElement("div");
        parentElm.className = "results";
        parentElm.innerHTML = html;

        const resetBtnElm = parentElm.querySelector(".resetBtn");
        resetBtnElm.addEventListener("click", () => {
            this.resetGame();
            this.displayStartView();
        });

        this.replaceView(parentElm);
    }

    // 画面の中身を新しい表示に置き換える
    replaceView(elm) {
        this.rootElm.innerHTML = "";
        this.rootElm.appendChild(elm);
    }
}
new Pref_capital_location_Quiz(document.getElementById("app")).init();
