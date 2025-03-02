//foreachをintervalを設けて実行する
const intervalForEach = (callback: (item: any, index: number) => void, array: any[], intervalTime: number) => {
  const length: number = array.length;
  let index: number = 0;
  const intervalId: number = window.setInterval(() => {
    if (index > length - 1) {
      clearInterval(intervalId);
    } else {
      callback(array[index], index);
      index += 1;
    }
  }, intervalTime);
};
//指定されたmsだけ待機する
const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
};

const XOR = (a: boolean, b: boolean) => {
  return (a || b) && !(a && b);
};
export { intervalForEach, wait, XOR };
