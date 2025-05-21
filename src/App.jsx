// src/App.jsx - MyMoney 가계부 + 달력 + CSV 기능
import React, { useEffect, useState } from "react";
import "./App.css";

const categories = ["식비", "교통", "고정지출", "쇼핑", "기타"];

const getToday = () => {
  const offset = new Date().getTimezoneOffset();
  const localTime = new Date(Date.now() - offset * 60 * 1000);
  return localTime.toISOString().slice(0, 10);
};

export default function App() {
  const [records, setRecords] = useState([]);
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isEditingId, setIsEditingId] = useState(null);
  const [newRecord, setNewRecord] = useState({
    item: "",
    category: categories[0],
    method: "현금",
    amount: "",
    memo: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("myMoneyRecords");
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("myMoneyRecords", JSON.stringify(records));
  }, [records]);

  const addRecord = () => {
    if (!newRecord.item || !newRecord.amount) return;
    const record = {
      id: Date.now().toString(),
      date: today,
      ...newRecord,
      amount: parseFloat(newRecord.amount) || 0,
    };
    setRecords((prev) => [...prev, record]);
    resetForm();
  };

  const editRecord = () => {
    const updated = records.map((r) =>
      r.id === isEditingId
        ? { ...r, ...newRecord, amount: parseFloat(newRecord.amount) || 0 }
        : r
    );
    setRecords(updated);
    resetForm();
  };

  const startEdit = (record) => {
    setIsEditingId(record.id);
    setNewRecord({
      item: record.item,
      category: record.category,
      method: record.method,
      amount: record.amount,
      memo: record.memo || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setNewRecord({
      item: "",
      category: categories[0],
      method: "현금",
      amount: "",
      memo: "",
    });
    setIsEditingId(null);
  };

  const deleteRecord = (id) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  const totalSelectedDate = records
    .filter((r) => r.date === selectedDate)
    .reduce((acc, cur) => acc + cur.amount, 0);

  const totalMonthly = records
    .filter((r) => r.date.slice(0, 7) === selectedDate.slice(0, 7))
    .reduce((acc, cur) => acc + cur.amount, 0);

  const getMonthRecords = () => {
    return records.filter(
      (r) => r.date.slice(0, 7) === selectedDate.slice(0, 7)
    );
  };

  const downloadCSV = () => {
    const headers = ["날짜", "항목", "분류", "결제수단", "금액", "메모"];
    const rows = getMonthRecords().map((r) => [
      r.date,
      r.item,
      r.category,
      r.method,
      r.amount,
      r.memo,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MyMoney_${selectedDate.slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <h1>MyMoney 가계부 💸 (지출 전용)</h1>

      <div className="form">
        <input
          placeholder="항목명 (예: 스타벅스, 편의점)"
          value={newRecord.item}
          onChange={(e) => setNewRecord({ ...newRecord, item: e.target.value })}
        />
        <select
          value={newRecord.category}
          onChange={(e) =>
            setNewRecord({ ...newRecord, category: e.target.value })
          }
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={newRecord.method}
          onChange={(e) =>
            setNewRecord({ ...newRecord, method: e.target.value })
          }
        >
          <option value="현금">현금</option>
          <option value="카드">카드</option>
          <option value="계좌이체">계좌이체</option>
        </select>
        <input
          placeholder="금액 (예: 15000)"
          type="number"
          value={newRecord.amount}
          onChange={(e) =>
            setNewRecord({ ...newRecord, amount: e.target.value })
          }
        />
        <textarea
          placeholder="메모"
          value={newRecord.memo}
          onChange={(e) => setNewRecord({ ...newRecord, memo: e.target.value })}
        ></textarea>
        {isEditingId ? (
          <>
            <button className="save" onClick={editRecord}>
              저장하기 💾
            </button>
            <button onClick={resetForm}>취소</button>
          </>
        ) : (
          <button className="save" onClick={addRecord}>
            추가하기 ➕
          </button>
        )}
      </div>

      <div className="list">
        <h2>
          <label>날짜 선택: </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </h2>
        <ul>
          {records
            .filter((r) => r.date === selectedDate)
            .map((record) => (
              <li key={record.id} className="task-item">
                <div>
                  <strong>{record.item}</strong> - {record.category} (
                  {record.method})<br />
                  <small>
                    {record.amount.toLocaleString()}원
                    {record.memo ? ` | 메모: ${record.memo}` : ""}
                  </small>
                </div>
                <div className="buttons">
                  <button
                    className="delete"
                    onClick={() => deleteRecord(record.id)}
                  >
                    삭제
                  </button>
                  <button className="edit" onClick={() => startEdit(record)}>
                    수정
                  </button>
                </div>
              </li>
            ))}
        </ul>
        <div className="total">
          일일 지출합:{" "}
          <span style={{ color: "red" }}>
            {totalSelectedDate.toLocaleString()}
          </span>
          원<br />
          월간 지출합:{" "}
          <span style={{ color: "red" }}>{totalMonthly.toLocaleString()}</span>
          원
        </div>
        <button className="download-btn" onClick={downloadCSV}>
          CSV 다운로드 📥
        </button>
      </div>
    </div>
  );
}
