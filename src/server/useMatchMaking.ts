import { toRefs } from "vue";
import { e, s, i } from "@/log";
import { playerStore, gameStore } from "@/main";
import { storeToRefs } from "pinia";
import { db } from "./firebase";
import { collection, doc, addDoc, updateDoc, getDocs, query, where, onSnapshot, deleteDoc } from "firebase/firestore";
import { converter } from "@/server/converter";
import { router } from "@/router";
import type { MatchStatus, PlayerData, GameData } from "@/types";

//Collectionの参照
const playersRef = collection(db, "players").withConverter(converter<PlayerData>());
const gamesRef = collection(db, "games").withConverter(converter<GameData>());

//マッチング待機中のplayerを検索する
async function findWaitingPlayer(): Promise<void> {
  const { id, player, log } = storeToRefs(playerStore);
  const { idEnemy } = toRefs(player.value);

  const waitingPlayers = (await getDocs(query(playersRef, where("match", "==", "waiting")))).docs.map((doc) => doc.id);
  console.log(i, "Found players: ", waitingPlayers);
  // 自分を除外する
  waitingPlayers.indexOf(id.value) ? undefined : waitingPlayers.splice(waitingPlayers.indexOf(id.value), 1);
  // ランダムに選択する
  idEnemy.value = waitingPlayers[Math.floor(Math.random() * waitingPlayers.length)];
  console.log(i, "Found players: ", waitingPlayers);
  waitingPlayers[0] ? console.log(i, "Found player: ", idEnemy.value) : console.log(i, "Not enough players to start a game");
}
async function findPasswordPlayer(): Promise<void> {
  const { id, player, log } = storeToRefs(playerStore);
  const { idEnemy, password } = toRefs(player.value);

  const waitingPlayers = (await getDocs(query(playersRef, where("password", "==", password.value)))).docs.map((doc) => doc.id);
  console.log(i, "Found players: ", waitingPlayers);
  // 自分を除外する
  waitingPlayers.indexOf(id.value) ? undefined : waitingPlayers.splice(waitingPlayers.indexOf(id.value), 1);
  // ランダムに選択する
  idEnemy.value = waitingPlayers[Math.floor(Math.random() * waitingPlayers.length)];
  console.log(i, "Found players: ", waitingPlayers);
  waitingPlayers[0] ? console.log(i, "Found player: ", idEnemy.value) : console.log(i, "Not enough players to start a game");
}
//playerのフィールド名を複数更新する
function updatePlayerFields(
  playerID: string,
  //!ここなんとかしたい
  updates: Array<{
    field: keyof PlayerData;
    value: string | MatchStatus | number | number[];
  }>
) {
  updates.forEach((update) => {
    updateDoc(doc(playersRef, playerID), { [update.field]: update.value });
    console.log(i, update.field, "updated: ", update.value, " for player: ", playerID);
  });
}
//matchの値がmatchingに変更されたら検知して、gameを開始する
async function watchMatchField(): Promise<void> {
  const { id, player } = storeToRefs(playerStore);
  const { idEnemy, idGame, match } = toRefs(player.value);

  const unsubscribe = onSnapshot(doc(playersRef, id.value), (snap) => {
    const data = snap.data() as PlayerData | undefined;
    if (!data) return;
    // 監視対象のフィールドが指定した値になった場合に実行される処理
    if (data.match === "matching") {
      console.log(i, "matchが", data.match, "に変更されました");
      idEnemy.value = data.idEnemy;
      idGame.value = data.idGame;
      // 監視を解除
      unsubscribe();
      //両プレイヤーのIDをgameに追加する
      gameStore.game.players = [idEnemy.value, id.value];
      //プレイヤーのマッチング状況を更新する
      match.value = "battle";
      updateDoc(doc(playersRef, id.value), { match: match.value });

      //画面遷移
      router.push({ name: "battle", params: { idGame: idGame.value } });
    }
  });
}
//gameを作成する
async function addGame(): Promise<string> {
  const { game } = storeToRefs(gameStore);
  const { id, player } = storeToRefs(playerStore);
  const { idEnemy } = toRefs(player.value);

  try {
    const docId = (await addDoc(gamesRef, game.value)).id;
    console.log(s, "games Document ID: ", docId);
    //両プレイヤーのIDをgameに追加する
    game.value.players = [id.value, idEnemy.value];
    await updateDoc(doc(gamesRef, docId), { players: [id.value, idEnemy.value] });
    return docId;
  } catch (error) {
    console.error(e, "Error adding games document: ", error);
  }
  return "";
}
//マッチングを開始する
async function startRandomMatchmaking(): Promise<void> {
  const { id, player, log } = storeToRefs(playerStore);
  const { idEnemy, idGame, match, gifts, character } = toRefs(player.value);

  //プレイヤーのマッチング状況を更新する
  match.value = "waiting";
  updatePlayerFields(id.value, [
    { field: "match", value: match.value },
    { field: "gifts", value: gifts.value },
    { field: "character", value: character.value },
  ]);
  // マッチング待機中のユーザーを検索する
  await findWaitingPlayer();
  // マッチング待機中のユーザーがいない場合は、マッチング待機中にする
  if (!idEnemy.value) {
    console.log(i, "マッチング待機中...");
    log.value = "マッチング待機中...";
    await watchMatchField();
  } else {
    idGame.value = await addGame();
    //プレイヤーの情報を更新する//実はここ結構気に入ってるんよね
    await Promise.all([
      updatePlayerFields(idEnemy.value, [
        { field: "idEnemy", value: id.value },
        { field: "idGame", value: idGame.value },
        { field: "match", value: "matching" },
      ]),
      updatePlayerFields(id.value, [
        { field: "idEnemy", value: idEnemy.value },
        { field: "idGame", value: idGame.value },
        { field: "match", value: "matching" },
      ]),
    ]);

    //画面遷移
    router.push({ name: "battle", params: { idGame: idGame.value } });
  }
}

async function startPasswordMatchmaking(): Promise<void> {
  const { id, player, log } = storeToRefs(playerStore);
  const { idEnemy, idGame, gifts, character, password } = toRefs(player.value);

  updatePlayerFields(id.value, [
    { field: "password", value: password.value },
    { field: "gifts", value: gifts.value },
    { field: "character", value: character.value },
  ]);
  // マッチング待機中のユーザーを検索する
  await findPasswordPlayer();
  // マッチング待機中のユーザーがいない場合は、マッチング待機中にする
  if (!idEnemy.value) {
    console.log(i, "マッチング待機中...");
    log.value = "マッチング待機中...";
    await watchMatchField();
  } else {
    idGame.value = await addGame();
    //プレイヤーの情報を更新する
    await Promise.all([
      updatePlayerFields(idEnemy.value, [
        { field: "password", value: "" },
        { field: "idEnemy", value: id.value },
        { field: "idGame", value: idGame.value },
        { field: "match", value: "matching" },
      ]),
      updatePlayerFields(id.value, [
        { field: "password", value: "" },
        { field: "idEnemy", value: idEnemy.value },
        { field: "idGame", value: idGame.value },
        { field: "match", value: "matching" },
      ]),
    ]);

    //画面遷移
    router.push({ name: "battle", params: { idGame: idGame.value } });
  }
}

//gameを削除する
async function deleteGame(): Promise<void> {
  const { idGame } = toRefs(playerStore.player);
  await deleteDoc(doc(gamesRef, idGame.value));
  console.log(i, "delete game: ", idGame.value);
}
//gameが削除されたら検知して、playerを初期化､ホームに戻る
async function watchDeleteGame(): Promise<void> {
  const { player, log } = storeToRefs(playerStore);
  const { idGame } = toRefs(player.value);

  console.log(i, "idGameを監視します");
  const unsubscribe = onSnapshot(doc(gamesRef, idGame.value), (snap) => {
    // 監視対象のDocumentが削除された場合に実行される処理
    if (!snap.exists()) {
      console.log(i, "idGameが削除されました");
      // 監視を解除
      unsubscribe();
      console.log(i, "idGameの監視を解除しました");
      //画面遷移
      console.log(s, "ゲーム終了");
      setTimeout(() => {
        log.value = "ゲーム終了";
        router.push({ name: "menu" });
      }, 1000);
    }
  });
}

export { startRandomMatchmaking as startMatchmaking, deleteGame, watchDeleteGame, startPasswordMatchmaking };
