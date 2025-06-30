export default function TestPage() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>React is Working!</h1>
      <p>If you can see this, React is loading correctly.</p>
      <div style={{ marginTop: "20px" }}>
        <h2>Next Steps:</h2>
        <ol>
          <li>Characters should load from the API</li>
          <li>You can create new characters</li>
          <li>Start conversations between characters</li>
        </ol>
      </div>
    </div>
  );
}